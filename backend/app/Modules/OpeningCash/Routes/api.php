<?php

use App\Modules\OpeningCash\Controllers\OpeningCashController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin|cashier'])->group(function () {
    Route::get('/opening-cashes', [OpeningCashController::class, 'index']);
    Route::get('/opening-cashes/today', [OpeningCashController::class, 'today']);
    Route::post('/opening-cashes', [OpeningCashController::class, 'store']);
    Route::get('/opening-cashes/{openingCash}', [OpeningCashController::class, 'show']);
    Route::put('/opening-cashes/{openingCash}', [OpeningCashController::class, 'update']);
    Route::delete('/opening-cashes/{openingCash}', [OpeningCashController::class, 'destroy']);
});
