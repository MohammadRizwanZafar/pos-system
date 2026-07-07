<?php

namespace App\Modules\Shop\Services;

use App\Models\User;
use App\Modules\Setting\Models\StoreSetting;
use App\Modules\Shop\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ShopService
{
    public function listShops()
    {
        return Shop::with(['owner.roles'])
            ->withCount([
                'users as cashiers_count' => fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', 'cashier')),
            ])
            ->orderBy('name')
            ->get();
    }

    public function getShop(Shop $shop): Shop
    {
        return $shop->load([
            'owner.roles',
            'users.roles',
            'storeSetting',
        ]);
    }

    public function createShop(array $data): Shop
    {
        return DB::transaction(function () use ($data) {
            $slug = $this->uniqueSlug($data['slug'] ?? Str::slug($data['name']));

            $shop = Shop::create([
                'name' => $data['name'],
                'slug' => $slug,
                'address' => $data['address'] ?? null,
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
            ]);

            $owner = User::create([
                'shop_id' => $shop->id,
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($data['owner_password']),
                'is_active' => true,
            ]);
            $owner->assignRole('admin');

            StoreSetting::create([
                'shop_id' => $shop->id,
                'store_name' => $shop->name,
                'address' => $shop->address,
                'phone' => $shop->phone,
                'tax_percent' => 0,
                'currency_symbol' => 'Rs.',
                'receipt_footer' => 'Thank you for shopping with us!',
            ]);

            return $this->getShop($shop);
        });
    }

    public function addCashier(Shop $shop, array $data): User
    {
        $user = User::create([
            'shop_id' => $shop->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? true,
        ]);
        $user->assignRole('cashier');

        return $user->load('roles');
    }

    public function updateShop(Shop $shop, array $data): Shop
    {
        $shop->update([
            'name' => $data['name'] ?? $shop->name,
            'address' => $data['address'] ?? $shop->address,
            'phone' => $data['phone'] ?? $shop->phone,
            'is_active' => $data['is_active'] ?? $shop->is_active,
        ]);

        if ($shop->storeSetting) {
            $shop->storeSetting->update([
                'store_name' => $shop->name,
                'address' => $shop->address,
                'phone' => $shop->phone,
            ]);
        }

        return $this->getShop($shop);
    }

    private function uniqueSlug(string $slug): string
    {
        $base = Str::slug($slug) ?: 'shop';
        $candidate = $base;
        $counter = 1;

        while (Shop::where('slug', $candidate)->exists()) {
            $candidate = "{$base}-{$counter}";
            $counter++;
        }

        return $candidate;
    }
}
