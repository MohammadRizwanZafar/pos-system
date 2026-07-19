<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ModuleServiceProvider extends ServiceProvider
{
    private array $modules = [
        'Auth',
        'Shop',
        'Category',
        'Product',
        'Sale',
        'Return',
        'Dashboard',
        'Report',
        'Setting',
        'Expense',
        'User',
    ];

    public function boot(): void
    {
        foreach ($this->modules as $module) {
            $routes = app_path("Modules/{$module}/Routes/api.php");
            if (file_exists($routes)) {
                Route::middleware('api')
                    ->prefix('api/v1')
                    ->group($routes);
            }

            $migrations = app_path("Modules/{$module}/Database/Migrations");
            if (is_dir($migrations)) {
                $this->loadMigrationsFrom($migrations);
            }
        }
    }
}
