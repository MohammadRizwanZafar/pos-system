<?php

use App\Modules\Dashboard\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
});
