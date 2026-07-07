<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Product\Models\Category;
use App\Modules\Product\Models\Product;
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
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
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

        $categories = [
            ['name' => 'Drinks', 'slug' => 'drinks'],
            ['name' => 'Snacks', 'slug' => 'snacks'],
            ['name' => 'Grocery', 'slug' => 'grocery'],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $category = Category::withoutGlobalScope('shop')->firstOrCreate(
                ['shop_id' => $shop->id, 'slug' => $cat['slug']],
                array_merge($cat, ['shop_id' => $shop->id])
            );
            $categoryIds[$cat['slug']] = $category->id;
        }

        $products = [
            ['name' => 'Coca Cola 500ml', 'sku' => 'DRK-001', 'category' => 'drinks', 'price' => 80, 'cost' => 60, 'stock' => 100],
            ['name' => 'Pepsi 500ml', 'sku' => 'DRK-002', 'category' => 'drinks', 'price' => 80, 'cost' => 60, 'stock' => 100],
            ['name' => 'Mineral Water 1L', 'sku' => 'DRK-003', 'category' => 'drinks', 'price' => 50, 'cost' => 35, 'stock' => 150],
            ['name' => 'Orange Juice 1L', 'sku' => 'DRK-004', 'category' => 'drinks', 'price' => 250, 'cost' => 180, 'stock' => 50],
            ['name' => 'Potato Chips', 'sku' => 'SNK-001', 'category' => 'snacks', 'price' => 120, 'cost' => 80, 'stock' => 80],
            ['name' => 'Chocolate Bar', 'sku' => 'SNK-002', 'category' => 'snacks', 'price' => 150, 'cost' => 100, 'stock' => 60],
            ['name' => 'Biscuit Pack', 'sku' => 'SNK-003', 'category' => 'snacks', 'price' => 90, 'cost' => 60, 'stock' => 70],
            ['name' => 'Rice 5kg', 'sku' => 'GRC-001', 'category' => 'grocery', 'price' => 850, 'cost' => 700, 'stock' => 30],
            ['name' => 'Cooking Oil 1L', 'sku' => 'GRC-002', 'category' => 'grocery', 'price' => 450, 'cost' => 380, 'stock' => 40],
            ['name' => 'Sugar 1kg', 'sku' => 'GRC-003', 'category' => 'grocery', 'price' => 180, 'cost' => 150, 'stock' => 50],
        ];

        foreach ($products as $product) {
            Product::withoutGlobalScope('shop')->firstOrCreate(
                ['shop_id' => $shop->id, 'sku' => $product['sku']],
                [
                    'shop_id' => $shop->id,
                    'name' => $product['name'],
                    'category_id' => $categoryIds[$product['category']],
                    'price' => $product['price'],
                    'cost' => $product['cost'],
                    'stock' => $product['stock'],
                    'is_active' => true,
                ]
            );
        }

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
