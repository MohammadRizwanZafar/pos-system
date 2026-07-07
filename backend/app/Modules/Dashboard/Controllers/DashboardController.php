<?php

namespace App\Modules\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dashboard\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private DashboardService $dashboardService) {}

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->dashboardService->getStats(
            $request->user(),
            $request->get('period', 'today'),
            $request->from_date,
            $request->to_date
        );

        return $this->success($stats);
    }
}
