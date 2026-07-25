<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_return_items', function (Blueprint $table) {
            $table->index('sale_item_id', 'sale_return_items_sale_item_id_index');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index(['shop_id', 'name'], 'categories_shop_name_index');
        });
    }

    public function down(): void
    {
        Schema::table('sale_return_items', function (Blueprint $table) {
            $table->dropIndex('sale_return_items_sale_item_id_index');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_shop_name_index');
        });
    }
};
