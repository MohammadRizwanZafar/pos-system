<?php

use App\Modules\Shop\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:super_admin'])->prefix('platform')->group(function () {
    Route::get('/shops', [ShopController::class, 'index']);
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/shops/{shop}', [ShopController::class, 'show']);
    Route::put('/shops/{shop}', [ShopController::class, 'update']);
    Route::post('/shops/{shop}/cashiers', [ShopController::class, 'storeCashier']);
});
