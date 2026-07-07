<?php

namespace App\Modules\Product\Services;

use App\Modules\Product\Models\Category;
use App\Modules\Product\Models\Product;
use Illuminate\Support\Str;

class ProductService
{
    public function listProducts(?string $search = null, ?int $categoryId = null)
    {
        return Product::with('category')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%"))
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function createProduct(array $data): Product
    {
        return Product::create($data);
    }

    public function updateProduct(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh('category');
    }

    public function deleteProduct(Product $product): void
    {
        $product->delete();
    }

    public function listCategories()
    {
        return Category::where('is_active', true)->orderBy('name')->get();
    }

    public function createCategory(array $data): Category
    {
        $data['slug'] = Str::slug($data['name']);

        return Category::create($data);
    }

    public function updateCategory(Category $category, array $data): Category
    {
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $category->update($data);

        return $category->fresh();
    }

    public function deleteCategory(Category $category): void
    {
        $category->delete();
    }
}
