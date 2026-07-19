<?php

namespace App\Modules\Sale\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Sale\Models\Sale;
use App\Modules\Sale\Requests\CreateSaleRequest;
use App\Modules\Sale\Services\SaleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    use ApiResponse;

    public function __construct(private SaleService $saleService) {}

    public function index(Request $request): JsonResponse
    {
        $sales = $this->saleService->listSales(
            $request->user(),
            $request->from_date,
            $request->to_date,
            $request->search,
            $request->has('per_page') ? $request->integer('per_page') : null
        );

        return $this->success($sales);
    }

    public function store(CreateSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->createSale(
            $request->user(),
            $request->validated()
        );

        return $this->success($sale, 'Sale created', 201);
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        $sale = $this->saleService->getSale($request->user(), $sale);

        return $this->success($sale);
    }

    public function invoice(Request $request, Sale $sale): JsonResponse
    {
        $sale = $this->saleService->getSale($request->user(), $sale);
        $invoice = $this->saleService->generateInvoice($sale);

        return $this->success($invoice);
    }
}
