<?php

namespace App\Modules\Report\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Report\Services\ReportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(private ReportService $reportService) {}

    public function sales(Request $request): JsonResponse
    {
        $report = $this->reportService->salesReport(
            $request->user(),
            $request->get('type', 'daily'),
            $request->from_date,
            $request->to_date
        );

        return $this->success($report);
    }

    public function expenses(Request $request): JsonResponse
    {
        $report = $this->reportService->expenseSummary(
            $request->user(),
            $request->from_date,
            $request->to_date
        );

        return $this->success($report);
    }
}
