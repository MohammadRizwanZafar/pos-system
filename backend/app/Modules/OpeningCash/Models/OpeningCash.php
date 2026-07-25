<?php

namespace App\Modules\OpeningCash\Models;

use App\Models\User;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpeningCash extends Model
{
    use BelongsToShop;

    protected $table = 'opening_cashes';

    protected $fillable = [
        'shop_id',
        'user_id',
        'business_date',
        'amount',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'business_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
