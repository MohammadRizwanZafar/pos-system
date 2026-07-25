<?php

namespace App\Modules\Shop\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shop\Models\Shop;
use App\Modules\Shop\Requests\StoreShopCashierRequest;
use App\Modules\Shop\Requests\StoreShopRequest;
use App\Modules\Shop\Services\ShopService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    use ApiResponse;

    public function __construct(private ShopService $shopService) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->shopService->listShops(
            $request->search,
            $request->has('per_page') ? $request->integer('per_page') : null
        ));
    }

    public function store(StoreShopRequest $request): JsonResponse
    {
        $shop = $this->shopService->createShop($request->validated());

        return $this->success($shop, 'Shop created', 201);
    }

    public function show(Shop $shop): JsonResponse
    {
        return $this->success($this->shopService->getShop($shop));
    }

    public function update(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $shop = $this->shopService->updateShop($shop, $data);

        return $this->success($shop, 'Shop updated');
    }

    public function storeCashier(StoreShopCashierRequest $request, Shop $shop): JsonResponse
    {
        $cashier = $this->shopService->addCashier($shop, $request->validated());

        return $this->success($cashier, 'Cashier added', 201);
    }
}
