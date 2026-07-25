<?php

namespace App\Modules\SoldProduct\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\SoldProduct\Services\SoldProductService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SoldProductController extends Controller
{
    use ApiResponse;

    public function __construct(private SoldProductService $soldProductService) {}

    public function index(Request $request): JsonResponse
    {
        $data = $this->soldProductService->listSoldProducts(
            $request->user(),
            $request->get('period', 'today'),
            $request->from_date,
            $request->to_date,
            $request->search,
            $request->has('per_page') ? $request->integer('per_page') : null,
            max(1, $request->integer('page') ?: 1)
        );

        return $this->success($data);
    }
}
