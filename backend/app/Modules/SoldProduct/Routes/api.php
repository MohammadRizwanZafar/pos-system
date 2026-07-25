<?php

use App\Modules\SoldProduct\Controllers\SoldProductController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::get('/sold-products', [SoldProductController::class, 'index']);
});
