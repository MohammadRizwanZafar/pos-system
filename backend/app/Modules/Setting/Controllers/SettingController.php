<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Setting\Requests\UpdateSettingRequest;
use App\Modules\Setting\Services\SettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    use ApiResponse;

    public function __construct(private SettingService $settingService) {}

    public function show(): JsonResponse
    {
        return $this->success($this->settingService->getSettings());
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $settings = $this->settingService->updateSettings($request->validated());

        return $this->success($settings, 'Settings updated');
    }
}
