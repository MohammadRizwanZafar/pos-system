<?php

use App\Modules\Report\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::get('/reports/sales', [ReportController::class, 'sales']);
});

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::get('/reports/expenses', [ReportController::class, 'expenses']);
});
