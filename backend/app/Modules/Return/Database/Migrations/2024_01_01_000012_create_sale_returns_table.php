<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('return_no')->unique();
            $table->decimal('refund_amount', 12, 2);
            $table->text('note')->nullable();
            $table->timestamp('returned_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
