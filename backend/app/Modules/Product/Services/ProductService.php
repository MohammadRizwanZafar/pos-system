<?php

namespace App\Modules\Product\Services;

use App\Modules\Product\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService
{
    public function listProducts(
        ?string $search = null,
        ?int $categoryId = null,
        ?int $perPage = null,
        bool $activeOnly = false
    ) {
        $search = $search !== null ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $query = Product::query()
            ->with(['category:id,name'])
            ->select([
                'id', 'shop_id', 'category_id', 'name', 'sku', 'barcode',
                'image', 'price', 'discount_percent', 'cost', 'stock', 'is_active',
                'created_at', 'updated_at',
            ])
            ->when($search, function ($q) use ($search) {
                $like = "%{$search}%";
                $compact = "%".str_replace(['-', ' '], '', $search)."%";

                $q->where(function ($searchQuery) use ($like, $compact, $search) {
                    $searchQuery->where('name', 'like', $like)
                        ->orWhere('sku', 'like', $like)
                        ->orWhere('barcode', 'like', $like)
                        // Match SKU even when user omits dashes: "aut0012" / "0012"
                        ->orWhereRaw("REPLACE(sku, '-', '') LIKE ?", [$compact]);

                    // Exact barcode / SKU first-path for scanners (uses indexes better)
                    if (strlen($search) >= 3) {
                        $searchQuery->orWhere('barcode', $search)
                            ->orWhere('sku', $search);
                    }
                });
            })
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($activeOnly, fn ($q) => $q->where('is_active', true))
            ->orderBy('name');

        if (! $perPage) {
            return $query->get();
        }

        $paginator = $query->paginate(min(max($perPage, 1), 100));

        return [
            'items' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function createProduct(array $data, ?UploadedFile $image = null): Product
    {
        return DB::transaction(function () use ($data, $image) {
            unset($data['sku'], $data['barcode'], $data['image'], $data['remove_image']);

            $data['sku'] = $this->generateSku($data['name']);
            $data['barcode'] = $this->generateBarcode($data['sku']);
            $data['discount_percent'] = $data['discount_percent'] ?? 0;

            if ($image) {
                $data['image'] = $image->store('products', 'public');
            }

            return Product::create($data);
        });
    }

    public function updateProduct(Product $product, array $data, ?UploadedFile $image = null): Product
    {
        unset($data['sku'], $data['barcode']);

        $removeImage = filter_var($data['remove_image'] ?? false, FILTER_VALIDATE_BOOLEAN);
        unset($data['remove_image'], $data['image']);

        if ($image) {
            $this->deleteImageFile($product->image);
            $data['image'] = $image->store('products', 'public');
        } elseif ($removeImage) {
            $this->deleteImageFile($product->image);
            $data['image'] = null;
        }

        $product->update($data);

        return $product->fresh('category');
    }

    public function deleteProduct(Product $product): void
    {
        $this->deleteImageFile($product->image);
        $product->delete();
    }

    private function deleteImageFile(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function generateSku(string $name): string
    {
        $letters = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', Str::ascii($name)) ?? '');
        $prefix = substr($letters, 0, 3);
        $prefix = str_pad($prefix ?: 'PRD', 3, 'X');

        $lastSku = Product::withoutGlobalScope('shop')
            ->where('sku', 'like', "{$prefix}-%")
            ->lockForUpdate()
            ->orderByDesc('sku')
            ->value('sku');

        $sequence = 1;
        if ($lastSku && preg_match('/-(\d+)$/', $lastSku, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        do {
            $sku = $prefix.'-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
            $sequence++;
        } while (
            Product::withoutGlobalScope('shop')->where('sku', $sku)->exists()
        );

        return $sku;
    }

    private function generateBarcode(string $sku): string
    {
        $attempt = 0;

        do {
            $hash = sprintf('%u', crc32($sku.'-'.$attempt));
            $body = '20'.str_pad(substr($hash, 0, 10), 10, '0');
            $barcode = $body.$this->ean13CheckDigit($body);
            $attempt++;
        } while (
            Product::withoutGlobalScope('shop')->where('barcode', $barcode)->exists()
        );

        return $barcode;
    }

    private function ean13CheckDigit(string $body): int
    {
        $sum = 0;

        for ($index = 0; $index < 12; $index++) {
            $digit = (int) $body[$index];
            $sum += $index % 2 === 0 ? $digit : $digit * 3;
        }

        return (10 - ($sum % 10)) % 10;
    }
}
