<?php

namespace App\Modules\Sale\Services;

use App\Models\User;
use App\Modules\Product\Models\Product;
use App\Modules\Sale\Models\Sale;
use App\Modules\Setting\Models\StoreSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function createSale(User $user, array $data): Sale
    {
        return DB::transaction(function () use ($user, $data) {
            $settings = StoreSetting::first();
            $taxPercent = $settings?->tax_percent ?? 0;
            $discount = $data['discount'] ?? 0;

            $subtotal = 0;
            $lineItems = [];

            foreach ($data['items'] as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                if (! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ["Product {$product->name} is not available."],
                    ]);
                }

                if ($product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for {$product->name}."],
                    ]);
                }

                $lineTotal = $product->price * $item['quantity'];
                $subtotal += $lineTotal;

                $lineItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'cost' => $product->cost ?? 0,
                    'total' => $lineTotal,
                ];
            }

            if ($discount > $subtotal) {
                throw ValidationException::withMessages([
                    'discount' => ['Discount cannot exceed subtotal.'],
                ]);
            }

            $taxable = $subtotal - $discount;
            $tax = round($taxable * ($taxPercent / 100), 2);
            $total = $taxable + $tax;
            $amountPaid = $data['amount_paid'];

            if ($amountPaid < $total) {
                throw ValidationException::withMessages([
                    'amount_paid' => ['Amount paid is less than total.'],
                ]);
            }

            $sale = Sale::create([
                'invoice_no' => $this->generateInvoiceNo(),
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'change_amount' => $amountPaid - $total,
                'note' => $data['note'] ?? null,
            ]);

            foreach ($lineItems as $line) {
                $sale->items()->create([
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'price' => $line['price'],
                    'cost' => $line['cost'],
                    'quantity' => $line['quantity'],
                    'total' => $line['total'],
                ]);

                $line['product']->decrement('stock', $line['quantity']);
            }

            return $sale->load(['items.product', 'user']);
        });
    }

    public function listSales(User $user, ?string $fromDate = null, ?string $toDate = null)
    {
        return Sale::with(['items', 'user', 'returns'])
            ->active()
            ->when($fromDate, fn ($q) => $q->whereDate('created_at', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('created_at', '<=', $toDate))
            ->orderByDesc('created_at')
            ->get();
    }

    public function getSale(User $user, Sale $sale): Sale
    {
        if (! $user->isAdmin() && ! $user->isCashier()) {
            abort(403, 'Unauthorized');
        }

        return $sale->load(['items.product', 'user']);
    }

    public function generateInvoice(Sale $sale): array
    {
        $settings = StoreSetting::first();

        return [
            'sale' => $sale->load(['items', 'user']),
            'store' => $settings,
        ];
    }

    private function generateInvoiceNo(): string
    {
        $date = now()->format('Ymd');
        $prefix = "INV-{$date}-";

        $lastSale = Sale::where('invoice_no', 'like', "{$prefix}%")
            ->orderByDesc('invoice_no')
            ->lockForUpdate()
            ->first();

        $sequence = 1;
        if ($lastSale) {
            $lastSequence = (int) substr($lastSale->invoice_no, -4);
            $sequence = $lastSequence + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
