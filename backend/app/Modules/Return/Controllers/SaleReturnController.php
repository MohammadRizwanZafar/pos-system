<?php

namespace App\Modules\Return\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Return\Requests\StoreSaleReturnRequest;
use App\Modules\Return\Services\SaleReturnService;
use App\Modules\Sale\Models\Sale;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleReturnController extends Controller
{
    use ApiResponse;

    public function __construct(private SaleReturnService $saleReturnService) {}

    public function index(Request $request): JsonResponse
    {
        $returns = $this->saleReturnService->listReturns(
            $request->user(),
            $request->from_date,
            $request->to_date
        );

        return $this->success($returns);
    }

    public function findSaleByInvoice(Request $request, string $invoiceNo): JsonResponse
    {
        $sale = $this->saleReturnService->findSaleByInvoice($request->user(), $invoiceNo);

        return $this->success($sale);
    }

    public function store(StoreSaleReturnRequest $request, Sale $sale): JsonResponse
    {
        $return = $this->saleReturnService->createReturn(
            $request->user(),
            $sale,
            $request->validated()
        );

        return $this->success($return, 'Return processed successfully', 201);
    }
}
