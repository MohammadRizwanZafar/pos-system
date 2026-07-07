<?php

namespace App\Modules\Expense\Models;

use App\Models\User;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use BelongsToShop;

    protected $fillable = [
        'shop_id', 'user_id', 'title', 'category', 'amount', 'expense_date', 'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
