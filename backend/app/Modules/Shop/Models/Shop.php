<?php

namespace App\Modules\Shop\Models;

use App\Models\User;
use App\Modules\Setting\Models\StoreSetting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Shop extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'address',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class)->whereHas('roles', fn ($q) => $q->where('name', 'admin'));
    }

    public function storeSetting(): HasOne
    {
        return $this->hasOne(StoreSetting::class);
    }
}
