<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost', 12, 2)->default(0)->after('price');
        });

        DB::statement('
            UPDATE sale_items
            INNER JOIN products ON sale_items.product_id = products.id
            SET sale_items.cost = products.cost
            WHERE sale_items.product_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }
};
