<?php

use App\Modules\Setting\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context'])->group(function () {
    Route::get('/settings', [SettingController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin'])->group(function () {
    Route::put('/settings', [SettingController::class, 'update']);
});
