<?php

namespace App\Modules\OpeningCash\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpeningCashRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'business_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
