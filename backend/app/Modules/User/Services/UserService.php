<?php

namespace App\Modules\User\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listUsers()
    {
        return User::with('roles')->orderBy('name')->get();
    }

    public function createUser(array $data): User
    {
        $data['role'] = 'cashier';

        $role = $data['role'];
        unset($data['role']);

        $data['password'] = Hash::make($data['password']);
        $data['is_active'] = $data['is_active'] ?? true;

        $user = User::create($data);
        $user->assignRole($role);

        return $user->load('roles');
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['role'])) {
            if ($user->hasRole('admin')) {
                unset($data['role']);
            } else {
                $data['role'] = 'cashier';
                $user->syncRoles([$data['role']]);
                unset($data['role']);
            }
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh('roles');
    }
}
