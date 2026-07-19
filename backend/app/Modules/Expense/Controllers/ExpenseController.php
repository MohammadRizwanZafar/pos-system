<?php

namespace App\Modules\Expense\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Expense\Models\Expense;
use App\Modules\Expense\Requests\StoreExpenseRequest;
use App\Modules\Expense\Requests\UpdateExpenseRequest;
use App\Modules\Expense\Services\ExpenseService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ApiResponse;

    public function __construct(private ExpenseService $expenseService) {}

    public function index(Request $request): JsonResponse
    {
        $expenses = $this->expenseService->listExpenses(
            $request->from_date,
            $request->to_date,
            $request->category,
            $request->search,
            $request->has('per_page') ? $request->integer('per_page') : null
        );

        return $this->success($expenses);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenseService->createExpense(
            $request->user(),
            $request->validated()
        );

        return $this->success($expense->load('user'), 'Expense created', 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return $this->success($expense->load('user'));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $expense = $this->expenseService->updateExpense($expense, $request->validated());

        return $this->success($expense, 'Expense updated');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->expenseService->deleteExpense($expense);

        return $this->success(null, 'Expense deleted');
    }
}
