<?php

namespace App\Modules\SoldProduct\Services;

use App\Models\User;
use App\Modules\Return\Models\SaleReturnItem;
use App\Modules\Sale\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SoldProductService
{
    public function listSoldProducts(
        User $user,
        string $period = 'today',
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $search = null,
        ?int $perPage = null,
        int $page = 1
    ): array {
        if (! $user->isAdmin()) {
            abort(403, 'Unauthorized');
        }

        [$start, $end] = $this->resolveDateRange($period, $fromDate, $toDate);
        $search = $search !== null ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $query = $this->baseQuery($start, $end, $search);

        $summaryBase = $query->clone();
        $summaryBase->getQuery()->orders = null;

        $summary = DB::query()
            ->fromSub($summaryBase->toBase(), 'sold_rows')
            ->selectRaw('COUNT(*) as row_count')
            ->selectRaw('COALESCE(SUM(quantity_sold), 0) as total_quantity')
            ->selectRaw('COALESCE(SUM(total_cost), 0) as total_cost')
            ->selectRaw('COALESCE(SUM(net_amount), 0) as total_amount')
            ->selectRaw('COUNT(DISTINCT product_id) as product_count')
            ->first();

        $ordered = $query->clone()
            ->orderByDesc(DB::raw('DATE(sales.created_at)'))
            ->orderByDesc('quantity_sold')
            ->orderBy('sale_items.product_name');

        $meta = null;

        if ($perPage) {
            $perPage = min(max($perPage, 1), 100);
            $page = max($page, 1);
            $total = (int) ($summary->row_count ?? 0);
            $lastPage = max(1, (int) ceil(max($total, 1) / $perPage));
            if ($total === 0) {
                $lastPage = 1;
            }
            if ($page > $lastPage) {
                $page = $lastPage;
            }

            $rows = $ordered->forPage($page, $perPage)->get();
            $meta = [
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ];
        } else {
            $rows = $ordered->get();
        }

        $items = $rows->map(fn ($row) => $this->mapRow($row))->values();

        return [
            'period' => $period,
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'product_count' => (int) ($summary->product_count ?? 0),
            'total_quantity' => (int) ($summary->total_quantity ?? 0),
            'total_cost' => round((float) ($summary->total_cost ?? 0), 2),
            'total_amount' => round((float) ($summary->total_amount ?? 0), 2),
            'items' => $items,
            'meta' => $meta,
        ];
    }

    private function baseQuery(Carbon $start, Carbon $end, ?string $search)
    {
        $returnedQuantities = SaleReturnItem::query()
            ->selectRaw('sale_item_id, SUM(quantity) as returned_qty')
            ->groupBy('sale_item_id');

        return Sale::query()
            ->active()
            ->whereBetween('sales.created_at', [$start, $end])
            ->join('sale_items', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoinSub($returnedQuantities, 'returned', function ($join) {
                $join->on('returned.sale_item_id', '=', 'sale_items.id');
            })
            ->when($search, function ($q) use ($search) {
                $like = "%{$search}%";
                $q->where(function ($searchQuery) use ($like) {
                    $searchQuery->where('sale_items.product_name', 'like', $like)
                        ->orWhere('products.sku', 'like', $like)
                        ->orWhere('products.barcode', 'like', $like);
                });
            })
            ->select([
                DB::raw('DATE(sales.created_at) as sold_date'),
                'sale_items.product_id',
                'sale_items.product_name',
                DB::raw('MAX(products.sku) as sku'),
                DB::raw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0)) as quantity_sold'),
                DB::raw('COUNT(DISTINCT CASE WHEN GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0) > 0 THEN sales.id END) as times_sold'),
                DB::raw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0) * COALESCE(sale_items.cost, 0)) as total_cost'),
                DB::raw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0) * sale_items.price) as net_amount'),
            ])
            ->groupBy(DB::raw('DATE(sales.created_at)'), 'sale_items.product_id', 'sale_items.product_name')
            ->havingRaw('SUM(GREATEST(sale_items.quantity - COALESCE(returned.returned_qty, 0), 0)) > 0');
    }

    private function mapRow(object $row): array
    {
        $qty = (int) $row->quantity_sold;
        $totalCost = round((float) $row->total_cost, 2);
        $soldDate = $row->sold_date;
        if ($soldDate instanceof Carbon) {
            $soldDate = $soldDate->toDateString();
        } else {
            $soldDate = Carbon::parse((string) $soldDate)->toDateString();
        }

        return [
            'sold_date' => $soldDate,
            'product_id' => $row->product_id,
            'product_name' => $row->product_name,
            'sku' => $row->sku,
            'quantity_sold' => $qty,
            'times_sold' => (int) $row->times_sold,
            'unit_cost' => $qty > 0 ? round($totalCost / $qty, 2) : 0,
            'total_cost' => $totalCost,
            'net_amount' => round((float) $row->net_amount, 2),
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
