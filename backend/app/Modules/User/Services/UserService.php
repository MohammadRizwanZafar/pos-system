<?php

namespace App\Modules\User\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listUsers(?string $search = null, ?int $perPage = null)
    {
        $search = $search !== null ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $query = User::query()
            ->with('roles:id,name')
            ->select(['id', 'shop_id', 'name', 'email', 'is_active', 'created_at'])
            ->when($search, function ($q) use ($search) {
                $like = "%{$search}%";
                $q->where(function ($searchQuery) use ($like) {
                    $searchQuery->where('name', 'like', $like)
                        ->orWhere('email', 'like', $like);
                });
            })
            ->orderBy('name');

        if (! $perPage) {
            return $query->get();
        }

        $paginator = $query->paginate(min(max($perPage, 1), 100));

        return [
            'items' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
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
