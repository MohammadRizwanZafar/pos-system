<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:9050'), '/');

    if (request()->expectsJson()) {
        return response()->json([
            'name' => 'POS System API',
            'version' => '1.0',
            'frontend' => $frontendUrl,
            'api_health' => url('/api/health'),
        ]);
    }

    return redirect()->away($frontendUrl);
});
