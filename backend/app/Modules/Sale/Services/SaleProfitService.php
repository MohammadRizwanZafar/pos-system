<?php

namespace App\Modules\Sale\Services;

use App\Models\User;
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
        $query = SaleItem::query()
            ->whereHas('sale', function ($q) use ($start, $end, $user, $adminOnly) {
                $q->whereBetween('created_at', [$start, $end]);

                if ($user && $adminOnly && ! $user->isAdmin()) {
                    $q->where('user_id', $user->id);
                }
            });

        return (float) $query
            ->selectRaw('COALESCE(SUM((price - cost) * quantity), 0) as profit')
            ->value('profit');
    }
}
