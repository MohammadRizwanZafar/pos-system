<?php

use App\Modules\Sale\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin|cashier'])->group(function () {
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::get('/sales/{sale}/invoice', [SaleController::class, 'invoice']);
});
