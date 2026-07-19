<?php

use App\Modules\Product\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin|cashier'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
    // POST supports multipart image upload (PHP does not parse files on PUT)
    Route::post('/products/{product}', [ProductController::class, 'update']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
});
