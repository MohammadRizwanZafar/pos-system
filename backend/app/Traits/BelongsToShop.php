<?php

namespace App\Traits;

use App\Modules\Shop\Models\Shop;
use App\Support\ShopContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToShop
{
    public static function bootBelongsToShop(): void
    {
        static::addGlobalScope('shop', function (Builder $builder) {
            if (ShopContext::isActive()) {
                $builder->where(
                    $builder->getModel()->qualifyColumn('shop_id'),
                    ShopContext::id()
                );
            }
        });

        static::creating(function ($model) {
            if (ShopContext::id() && empty($model->shop_id)) {
                $model->shop_id = ShopContext::id();
            }
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
