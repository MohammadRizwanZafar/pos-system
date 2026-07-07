<?php

namespace App\Modules\Setting\Services;

use App\Modules\Setting\Models\StoreSetting;
use App\Support\ShopContext;

class SettingService
{
    public function getSettings(): StoreSetting
    {
        return StoreSetting::firstOrCreate(
            ['shop_id' => ShopContext::id()],
            [
                'store_name' => 'My Shop',
                'currency_symbol' => 'Rs.',
                'tax_percent' => 0,
            ]
        );
    }

    public function updateSettings(array $data): StoreSetting
    {
        $settings = $this->getSettings();
        $settings->update($data);

        return $settings->fresh();
    }
}
