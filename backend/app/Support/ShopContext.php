<?php

namespace App\Support;

class ShopContext
{
    private static ?int $shopId = null;

    private static bool $scopeEnabled = false;

    public static function set(?int $shopId): void
    {
        self::$shopId = $shopId;
        self::$scopeEnabled = $shopId !== null;
    }

    public static function id(): ?int
    {
        return self::$shopId;
    }

    public static function isActive(): bool
    {
        return self::$scopeEnabled && self::$shopId !== null;
    }

    public static function clear(): void
    {
        self::$shopId = null;
        self::$scopeEnabled = false;
    }
}
