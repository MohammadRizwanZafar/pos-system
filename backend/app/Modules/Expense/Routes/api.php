<?php

use App\Modules\Expense\Controllers\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'shop.context', 'role:admin|cashier'])->group(function () {
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);
});
