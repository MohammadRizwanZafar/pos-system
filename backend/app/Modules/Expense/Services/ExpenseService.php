<?php

namespace App\Modules\Expense\Services;

use App\Models\User;
use App\Modules\Expense\Models\Expense;

class ExpenseService
{
    public function listExpenses(?string $fromDate = null, ?string $toDate = null, ?string $category = null)
    {
        return Expense::with('user')
            ->when($fromDate, fn ($q) => $q->whereDate('expense_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->whereDate('expense_date', '<=', $toDate))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->orderByDesc('expense_date')
            ->get();
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
