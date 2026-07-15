<?php

namespace App\Modules\Sale\Services;

use App\Models\User;
use App\Modules\Return\Models\SaleReturnItem;
use App\Modules\Sale\Models\SaleItem;
use Carbon\Carbon;

class SaleProfitService
{
    public function calculateProfit(
        Carbon $start,
        Carbon $end,
        ?User $user = null,
        bool $adminOnly = true
    ): float {
        $saleItems = SaleItem::query()
            ->whereHas('sale', function ($q) use ($start, $end, $user, $adminOnly) {
                $q->active()->whereBetween('created_at', [$start, $end]);

                if ($user && $adminOnly && ! $user->isAdmin()) {
                    $q->where('user_id', $user->id);
                }
            })
            ->get(['id', 'sale_id', 'price', 'cost', 'quantity']);

        $returnedBySaleItem = SaleReturnItem::query()
            ->whereIn('sale_item_id', $saleItems->pluck('id'))
            ->selectRaw('sale_item_id, SUM(quantity) as returned_qty')
            ->groupBy('sale_item_id')
            ->pluck('returned_qty', 'sale_item_id');

        $profit = 0.0;

        foreach ($saleItems as $item) {
            $returnedQty = (int) ($returnedBySaleItem[$item->id] ?? 0);
            $effectiveQty = max(0, (int) $item->quantity - $returnedQty);

            if ($effectiveQty <= 0) {
                continue;
            }

            $profit += ((float) $item->price - (float) ($item->cost ?? 0)) * $effectiveQty;
        }

        return round($profit, 2);
    }
}
