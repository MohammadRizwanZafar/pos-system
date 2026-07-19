<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['shop_id', 'status', 'created_at'], 'sales_shop_status_created_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['shop_id', 'is_active', 'name'], 'products_shop_active_name_index');
            $table->index(['shop_id', 'category_id', 'is_active'], 'products_shop_category_active_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['shop_id', 'expense_date'], 'expenses_shop_date_index');
        });

        Schema::table('sale_returns', function (Blueprint $table) {
            $table->index(['shop_id', 'returned_at'], 'returns_shop_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_shop_status_created_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_shop_active_name_index');
            $table->dropIndex('products_shop_category_active_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('expenses_shop_date_index');
        });

        Schema::table('sale_returns', function (Blueprint $table) {
            $table->dropIndex('returns_shop_date_index');
        });
    }
};
