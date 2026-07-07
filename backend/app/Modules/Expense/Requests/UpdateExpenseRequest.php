<?php

namespace App\Modules\Expense\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'expense_date' => ['sometimes', 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
