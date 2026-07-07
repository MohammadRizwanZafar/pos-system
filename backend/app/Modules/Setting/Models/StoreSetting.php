<?php

namespace App\Modules\Setting\Models;

use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use BelongsToShop;

    protected $fillable = [
        'shop_id', 'store_name', 'address', 'phone',
        'tax_percent', 'currency_symbol', 'receipt_footer',
    ];

    protected function casts(): array
    {
        return ['tax_percent' => 'decimal:2'];
    }
}
