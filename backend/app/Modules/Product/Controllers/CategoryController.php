<?php

namespace App\Modules\Product\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Product\Models\Category;
use App\Modules\Product\Requests\StoreCategoryRequest;
use App\Modules\Product\Requests\UpdateCategoryRequest;
use App\Modules\Product\Services\ProductService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use ApiResponse;

    public function __construct(private ProductService $productService) {}

    public function index(): JsonResponse
    {
        return $this->success($this->productService->listCategories());
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->productService->createCategory($request->validated());

        return $this->success($category, 'Category created', 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->productService->updateCategory($category, $request->validated());

        return $this->success($category, 'Category updated');
    }

    public function destroy(Category $category): JsonResponse
    {
        $this->productService->deleteCategory($category);

        return $this->success(null, 'Category deleted');
    }
}
