<?php

namespace App\Modules\Dashboard\Services;

use App\Models\User;
use App\Modules\Expense\Models\Expense;
use App\Modules\Sale\Models\Sale;
use App\Modules\Sale\Services\SaleProfitService;
use Carbon\Carbon;

class DashboardService
{
    public function __construct(private SaleProfitService $saleProfitService) {}

    public function getStats(User $user, string $period = 'today', ?string $fromDate = null, ?string $toDate = null): array
    {
        [$start, $end] = $this->resolveDateRange($period, $fromDate, $toDate);

        $salesQuery = Sale::active()->whereBetween('created_at', [$start, $end]);
        $expensesQuery = Expense::whereBetween('expense_date', [$start->toDateString(), $end->toDateString()]);

        if (! $user->isAdmin()) {
            $salesQuery->where('user_id', $user->id);
            $expensesQuery->where('user_id', $user->id);
        }

        $totalSales = (float) $salesQuery->clone()
            ->selectRaw('COALESCE(SUM(total - refunded_amount), 0) as net_sales')
            ->value('net_sales');
        $orderCount = (int) $salesQuery->count();
        $totalExpenses = (float) $expensesQuery->sum('amount');
        $profit = $this->saleProfitService->calculateProfit($start, $end, $user);

        return [
            'period' => $period,
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'total_sales' => round($totalSales, 2),
            'order_count' => $orderCount,
            'total_expenses' => round($totalExpenses, 2),
            'profit' => round($profit, 2),
            'net_profit' => round($profit, 2),
        ];
    }

    private function resolveDateRange(string $period, ?string $fromDate, ?string $toDate): array
    {
        return match ($period) {
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'custom' => [
                Carbon::parse($fromDate)->startOfDay(),
                Carbon::parse($toDate)->endOfDay(),
            ],
            default => [now()->startOfDay(), now()->endOfDay()],
        };
    }
}
