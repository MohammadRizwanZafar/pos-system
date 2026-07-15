<?php

namespace App\Modules\Sale\Models;

use App\Models\User;
use App\Modules\Return\Models\SaleReturn;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use BelongsToShop;

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_PARTIALLY_RETURNED = 'partially_returned';

    public const STATUS_FULLY_RETURNED = 'fully_returned';

    protected $fillable = [
        'shop_id', 'invoice_no', 'user_id', 'subtotal', 'discount',
        'tax', 'total', 'amount_paid', 'change_amount', 'note',
        'status', 'refunded_amount',
    ];

    protected $appends = ['net_total'];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
        ];
    }

    public function getNetTotalAttribute(): float
    {
        return round(max(0, (float) $this->total - (float) $this->refunded_amount), 2);
    }

    public function isFullyReturned(): bool
    {
        return $this->status === self::STATUS_FULLY_RETURNED;
    }

    public function scopeActive($query)
    {
        return $query->where('status', '!=', self::STATUS_FULLY_RETURNED);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }
}
