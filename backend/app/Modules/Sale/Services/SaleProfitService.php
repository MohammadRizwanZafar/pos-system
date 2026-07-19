<?php

namespace App\Modules\Sale\Services;

use App\Models\User;
use App\Modules\Return\Models\SaleReturnItem;
use App\Modules\Sale\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaleProfitService
{
    public function calculateProfit(
        Carbon $start,
        Carbon $end,
        ?User $user = null,
        bool $adminOnly = true
    ): float {
        $returnedQuantities = SaleReturnItem::query()
            ->selectRaw('sale_item_id, SUM(quantity) as returned_qty')
            ->groupBy('sale_item_id');

        $sales = Sale::query()
            ->active()
            ->whereBetween('sales.created_at', [$start, $end])
            ->when(
                $user && $adminOnly && ! $user->isAdmin(),
                fn ($q) => $q->where('sales.user_id', $user->id)
            )
            ->join('sale_items', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoinSub($returnedQuantities, 'returned', function ($join) {
                $join->on('returned.sale_item_id', '=', 'sale_items.id');
            })
            ->groupBy('sales.id', 'sales.subtotal', 'sales.discount')
            ->get([
                'sales.id',
                'sales.subtotal',
                'sales.discount',
                DB::raw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0) * sale_items.price) as remaining_revenue'),
                DB::raw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0) * COALESCE(sale_items.cost, 0)) as remaining_cost'),
            ]);

        $profit = 0.0;

        foreach ($sales as $sale) {
            $remainingValue = (float) $sale->remaining_revenue;
            $saleProfit = $remainingValue - (float) $sale->remaining_cost;

            // Discount reduces profit, prorated by the non-returned portion of the sale
            $subtotal = (float) $sale->subtotal;
            $discount = (float) $sale->discount;

            if ($discount > 0 && $subtotal > 0) {
                $saleProfit -= $discount * min(1, $remainingValue / $subtotal);
            }

            $profit += $saleProfit;
        }

        return round($profit, 2);
    }
}
