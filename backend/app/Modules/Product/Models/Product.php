<?php

namespace App\Modules\Product\Models;

use App\Modules\Category\Models\Category;
use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use BelongsToShop;

    protected $fillable = [
        'shop_id', 'category_id', 'name', 'sku', 'barcode',
        'image', 'price', 'discount_percent', 'cost', 'stock', 'is_active',
    ];

    protected $appends = ['image_url', 'sell_price'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'cost' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function getSellPriceAttribute(): string
    {
        $price = (float) $this->price;
        $discount = min(100, max(0, (float) ($this->discount_percent ?? 0)));
        $sell = round($price * (1 - ($discount / 100)), 2);

        return number_format($sell, 2, '.', '');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        return Storage::disk('public')->url($this->image);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
