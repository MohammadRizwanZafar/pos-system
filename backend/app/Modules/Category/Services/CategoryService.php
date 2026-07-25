<?php

namespace App\Modules\Category\Services;

use App\Modules\Category\Models\Category;
use Illuminate\Support\Str;

class CategoryService
{
    public function listCategories(
        ?string $search = null,
        ?int $perPage = null,
        bool $activeOnly = false
    ) {
        $search = $search !== null ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $query = Category::query()
            ->when($activeOnly, fn ($q) => $q->where('is_active', true))
            ->when($search, function ($q) use ($search) {
                $like = "%{$search}%";
                $q->where(function ($searchQuery) use ($like) {
                    $searchQuery->where('name', 'like', $like)
                        ->orWhere('slug', 'like', $like);
                });
            })
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

    public function createCategory(array $data): Category
    {
        $data['slug'] = Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

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
