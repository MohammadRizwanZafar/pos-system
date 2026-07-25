<?php

namespace App\Modules\OpeningCash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\OpeningCash\Models\OpeningCash;
use App\Modules\OpeningCash\Requests\StoreOpeningCashRequest;
use App\Modules\OpeningCash\Requests\UpdateOpeningCashRequest;
use App\Modules\OpeningCash\Services\OpeningCashService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpeningCashController extends Controller
{
    use ApiResponse;

    public function __construct(private OpeningCashService $openingCashService) {}

    public function index(Request $request): JsonResponse
    {
        $items = $this->openingCashService->listOpeningCashes(
            $request->from_date,
            $request->to_date,
            $request->search,
            $request->has('per_page') ? $request->integer('per_page') : null
        );

        return $this->success($items);
    }

    public function today(Request $request): JsonResponse
    {
        $date = $request->date ?: now()->toDateString();
        $record = $this->openingCashService->getForDate($date);

        return $this->success($record);
    }

    public function store(StoreOpeningCashRequest $request): JsonResponse
    {
        $record = $this->openingCashService->upsertOpeningCash(
            $request->user(),
            $request->validated()
        );

        return $this->success($record, 'Opening cash saved', 201);
    }

    public function show(OpeningCash $openingCash): JsonResponse
    {
        return $this->success($openingCash->load('user'));
    }

    public function update(UpdateOpeningCashRequest $request, OpeningCash $openingCash): JsonResponse
    {
        $record = $this->openingCashService->updateOpeningCash(
            $openingCash,
            $request->validated()
        );

        return $this->success($record, 'Opening cash updated');
    }

    public function destroy(OpeningCash $openingCash): JsonResponse
    {
        $this->openingCashService->deleteOpeningCash($openingCash);

        return $this->success(null, 'Opening cash deleted');
    }
}
