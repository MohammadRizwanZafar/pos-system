<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('shops')->insert([
            'name' => 'Shops',
            'slug' => 'shop',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        DB::table('users')->update(['shop_id' => 1]);

        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('store_settings', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        DB::table('categories')->update(['shop_id' => 1]);
        DB::table('products')->update(['shop_id' => 1]);
        DB::table('sales')->update(['shop_id' => 1]);
        DB::table('expenses')->update(['shop_id' => 1]);
        DB::table('store_settings')->update(['shop_id' => 1]);

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->unique(['shop_id', 'slug']);
            $table->foreignId('shop_id')->nullable(false)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->unique(['shop_id', 'sku']);
            $table->foreignId('shop_id')->nullable(false)->change();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['invoice_no']);
            $table->unique(['shop_id', 'invoice_no']);
            $table->foreignId('shop_id')->nullable(false)->change();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable(false)->change();
        });

        Schema::table('store_settings', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'invoice_no']);
            $table->unique(['invoice_no']);
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'sku']);
            $table->unique(['sku']);
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'slug']);
            $table->unique(['slug']);
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });

        Schema::dropIfExists('shops');
    }
};
