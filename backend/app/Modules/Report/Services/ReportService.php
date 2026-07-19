<?php

namespace App\Modules\Report\Services;

use App\Models\User;
use App\Modules\Expense\Models\Expense;
use App\Modules\Sale\Models\Sale;
use App\Modules\Sale\Services\SaleProfitService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public function __construct(private SaleProfitService $saleProfitService) {}
    public function salesReport(
        User $user,
        string $type = 'daily',
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $search = null,
        ?int $perPage = null
    ): array {
        [$start, $end] = $this->resolveRange($type, $fromDate, $toDate);

        $query = Sale::with('user:id,name')
            ->active()
            ->whereBetween('created_at', [$start, $end])
            ->when($search, fn ($q) => $q->where(function ($searchQuery) use ($search) {
                $searchQuery->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            }));

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $summaryQuery = clone $query;
        $totalSales = (float) (clone $summaryQuery)
            ->selectRaw('COALESCE(SUM(total - refunded_amount), 0) as net_sales')
            ->value('net_sales');
        $orderCount = (clone $summaryQuery)->count();

        $salesMeta = null;
        if ($perPage) {
            $paginator = $query->orderByDesc('created_at')->paginate(min(max($perPage, 1), 100));
            $sales = $paginator->items();
            $salesMeta = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ];
        } else {
            $sales = $query->orderByDesc('created_at')->get();
        }

        return [
            'type' => $type,
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'total_sales' => round($totalSales, 2),
            'order_count' => $orderCount,
            'profit' => round($this->saleProfitService->calculateProfit($start, $end, $user), 2),
            'sales' => $sales,
            'sales_meta' => $salesMeta,
        ];
    }

    public function expenseSummary(User $user, ?string $fromDate = null, ?string $toDate = null): array
    {
        if (! $user->isAdmin()) {
            abort(403, 'Unauthorized');
        }

        $start = $fromDate ? Carbon::parse($fromDate)->startOfDay() : now()->startOfMonth();
        $end = $toDate ? Carbon::parse($toDate)->endOfDay() : now()->endOfMonth();

        $expenses = Expense::with('user')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('expense_date')
            ->get();

        $byCategory = $expenses->groupBy('category')->map(function (Collection $group, ?string $category) {
            return [
                'category' => $category ?: 'Uncategorized',
                'total' => round((float) $group->sum('amount'), 2),
                'count' => $group->count(),
            ];
        })->values();

        return [
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'total_expenses' => round((float) $expenses->sum('amount'), 2),
            'expense_count' => $expenses->count(),
            'by_category' => $byCategory,
            'expenses' => $expenses,
        ];
    }

    private function resolveRange(string $type, ?string $fromDate, ?string $toDate): array
    {
        return match ($type) {
            'weekly' => [now()->startOfWeek(), now()->endOfWeek()],
            'monthly' => [now()->startOfMonth(), now()->endOfMonth()],
            'date-range' => [
                Carbon::parse($fromDate)->startOfDay(),
                Carbon::parse($toDate)->endOfDay(),
            ],
            default => [now()->startOfDay(), now()->endOfDay()],
        };
    }
}
