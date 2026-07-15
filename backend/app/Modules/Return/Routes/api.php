<?php

use App\Modules\Return\Controllers\SaleReturnController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin|cashier'])->group(function () {
    Route::get('/returns/sale-by-invoice/{invoiceNo}', [SaleReturnController::class, 'findSaleByInvoice']);
    Route::post('/sales/{sale}/returns', [SaleReturnController::class, 'store']);
    Route::get('/returns', [SaleReturnController::class, 'index']);
});
