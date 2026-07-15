<?php

namespace App\Modules\Return\Services;

use App\Models\User;
use App\Modules\Product\Models\Product;
use App\Modules\Return\Models\SaleReturn;
use App\Modules\Return\Models\SaleReturnItem;
use App\Modules\Sale\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleReturnService
{
    public function listReturns(User $user, ?string $fromDate = null, ?string $toDate = null)
    {
        return SaleReturn::with(['sale', 'user', 'items'])
            ->when($fromDate, fn ($q) => $q->whereDate('returned_at', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('returned_at', '<=', $toDate))
            ->orderByDesc('returned_at')
            ->get();
    }

    public function findSaleByInvoice(User $user, string $invoiceNo): array
    {
        $sale = Sale::with(['items', 'user'])
            ->where('invoice_no', $invoiceNo)
            ->firstOrFail();

        if (! $user->isAdmin() && ! $user->isCashier()) {
            abort(403, 'Unauthorized');
        }

        $items = $sale->items->map(function ($item) use ($sale) {
            $returnedQty = (int) SaleReturnItem::where('sale_item_id', $item->id)
                ->whereHas('saleReturn', fn ($q) => $q->where('sale_id', $sale->id))
                ->sum('quantity');

            $soldQty = (int) $item->quantity;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'price' => $item->price,
                'quantity' => $soldQty,
                'returned_quantity' => $returnedQty,
                'remaining_quantity' => max(0, $soldQty - $returnedQty),
                'total' => $item->total,
            ];
        });

        return [
            'id' => $sale->id,
            'invoice_no' => $sale->invoice_no,
            'created_at' => $sale->created_at,
            'total' => $sale->total,
            'user' => $sale->user,
            'items' => $items,
        ];
    }

    public function createReturn(User $user, Sale $sale, array $data): SaleReturn
    {
        if (! $user->isAdmin() && ! $user->isCashier()) {
            abort(403, 'Unauthorized');
        }

        return DB::transaction(function () use ($user, $sale, $data) {
            $sale->load('items');
            $requestItems = collect($data['items'])->keyBy('sale_item_id');
            $saleItems = $sale->items->whereIn('id', $requestItems->keys()->all())->keyBy('id');

            if ($saleItems->count() !== $requestItems->count()) {
                throw ValidationException::withMessages([
                    'items' => ['One or more sale items are invalid for this sale.'],
                ]);
            }

            $refundAmount = 0;
            $returnLines = [];

            foreach ($requestItems as $saleItemId => $payload) {
                $saleItem = $saleItems[$saleItemId];
                $requestedQty = (int) $payload['quantity'];

                $alreadyReturned = (int) SaleReturnItem::where('sale_item_id', $saleItem->id)
                    ->whereHas('saleReturn', fn ($q) => $q->where('sale_id', $sale->id))
                    ->lockForUpdate()
                    ->sum('quantity');

                $remainingQty = (int) $saleItem->quantity - $alreadyReturned;
                if ($requestedQty > $remainingQty) {
                    throw ValidationException::withMessages([
                        'items' => ["Return quantity for {$saleItem->product_name} exceeds remaining quantity ({$remainingQty})."],
                    ]);
                }

                $lineTotal = (float) $saleItem->price * $requestedQty;
                $refundAmount += $lineTotal;

                $returnLines[] = [
                    'sale_item' => $saleItem,
                    'quantity' => $requestedQty,
                    'total' => $lineTotal,
                ];
            }

            $saleReturn = SaleReturn::create([
                'sale_id' => $sale->id,
                'user_id' => $user->id,
                'return_no' => $this->generateReturnNo(),
                'refund_amount' => round($refundAmount, 2),
                'note' => $data['note'] ?? null,
                'returned_at' => now(),
            ]);

            foreach ($returnLines as $line) {
                $saleItem = $line['sale_item'];

                $saleReturn->items()->create([
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'product_name' => $saleItem->product_name,
                    'price' => $saleItem->price,
                    'cost' => $saleItem->cost ?? 0,
                    'quantity' => $line['quantity'],
                    'total' => $line['total'],
                ]);

                Product::whereKey($saleItem->product_id)->lockForUpdate()->first()?->increment('stock', $line['quantity']);
            }

            $this->refreshSaleReturnState($sale);

            return $saleReturn->load(['sale', 'user', 'items']);
        });
    }

    private function refreshSaleReturnState(Sale $sale): void
    {
        $sale->refresh()->load('items');

        $refundedAmount = (float) SaleReturn::where('sale_id', $sale->id)->sum('refund_amount');
        $allItemsFullyReturned = $sale->items->every(function ($item) use ($sale) {
            $returnedQty = (int) SaleReturnItem::where('sale_item_id', $item->id)
                ->whereHas('saleReturn', fn ($q) => $q->where('sale_id', $sale->id))
                ->sum('quantity');

            return $returnedQty >= (int) $item->quantity;
        });

        $sale->update([
            'refunded_amount' => round($refundedAmount, 2),
            'status' => $allItemsFullyReturned
                ? Sale::STATUS_FULLY_RETURNED
                : ($refundedAmount > 0 ? Sale::STATUS_PARTIALLY_RETURNED : Sale::STATUS_COMPLETED),
        ]);
    }

    private function generateReturnNo(): string
    {
        $date = now()->format('Ymd');
        $prefix = "RET-{$date}-";

        $last = SaleReturn::where('return_no', 'like', "{$prefix}%")
            ->orderByDesc('return_no')
            ->lockForUpdate()
            ->first();

        $sequence = 1;
        if ($last) {
            $sequence = ((int) substr($last->return_no, -4)) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
