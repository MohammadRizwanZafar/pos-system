<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name')->default('My Shop');
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->string('currency_symbol')->default('Rs.');
            $table->text('receipt_footer')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
