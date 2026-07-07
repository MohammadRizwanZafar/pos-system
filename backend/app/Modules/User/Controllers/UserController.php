<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\User\Requests\StoreUserRequest;
use App\Modules\User\Requests\UpdateUserRequest;
use App\Modules\User\Services\UserService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(private UserService $userService) {}

    public function index(): JsonResponse
    {
        return $this->success($this->userService->listUsers());
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->validated());

        return $this->success($user, 'User created', 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success($user->load('roles'));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->updateUser($user, $request->validated());

        return $this->success($user, 'User updated');
    }
}
