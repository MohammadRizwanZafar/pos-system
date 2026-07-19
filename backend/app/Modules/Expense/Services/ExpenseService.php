<?php

namespace App\Modules\Expense\Services;

use App\Models\User;
use App\Modules\Expense\Models\Expense;

class ExpenseService
{
    public function listExpenses(
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $category = null,
        ?string $search = null,
        ?int $perPage = null
    ) {
        $query = Expense::with('user:id,name')
            ->when($fromDate, fn ($q) => $q->where('expense_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->where('expense_date', '<=', $toDate))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, fn ($q) => $q->where(function ($searchQuery) use ($search) {
                $searchQuery->where('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            }))
            ->orderByDesc('expense_date')
            ->orderByDesc('id');

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

    public function createExpense(User $user, array $data): Expense
    {
        $data['user_id'] = $user->id;

        return Expense::create($data);
    }

    public function updateExpense(Expense $expense, array $data): Expense
    {
        $expense->update($data);

        return $expense->fresh('user');
    }

    public function deleteExpense(Expense $expense): void
    {
        $expense->delete();
    }
}
