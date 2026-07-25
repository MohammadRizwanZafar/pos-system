<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Setting\Models\StoreSetting;
use App\Modules\Shop\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'manage_products',
            'view_products',
            'use_pos',
            'view_reports',
            'manage_settings',
            'manage_users',
            'manage_expenses',
            'record_expenses',
            'view_dashboard',
            'manage_shops',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'web']);

        $superAdminRole->syncPermissions($permissions);
        $adminRole->syncPermissions(array_diff($permissions, ['manage_shops']));
        $cashierRole->syncPermissions(['use_pos', 'view_products', 'manage_expenses']);

        $shop = Shop::firstOrCreate(
            ['slug' => 'default-shop'],
            ['name' => 'Demo Shop', 'is_active' => true]
        );

        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@pos.com'],
            [
                'shop_id' => null,
                'name' => 'Super Admin',
                'password' => Hash::make('admin0101'),
                'is_active' => true,
            ]
        );
        if (! Hash::check('admin0101', $superAdmin->password)) {
            $superAdmin->update(['password' => Hash::make('admin0101')]);
        }
        $superAdmin->syncRoles(['super_admin']);

        $admin = User::firstOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'shop_id' => $shop->id,
                'name' => 'Shop Owner',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        if (! $admin->shop_id) {
            $admin->update(['shop_id' => $shop->id]);
        }
        $admin->syncRoles(['admin']);

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@pos.com'],
            [
                'shop_id' => $shop->id,
                'name' => 'Cashier',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        if (! $cashier->shop_id) {
            $cashier->update(['shop_id' => $shop->id]);
        }
        $cashier->syncRoles(['cashier']);

        StoreSetting::withoutGlobalScope('shop')->firstOrCreate(
            ['shop_id' => $shop->id],
            [
                'shop_id' => $shop->id,
                'store_name' => 'Demo Shop',
                'address' => '123 Main Street',
                'phone' => '+94 11 234 5678',
                'tax_percent' => 0,
                'currency_symbol' => 'Rs.',
                'receipt_footer' => 'Thank you for shopping with us!',
            ]
        );
    }
}
