<?php

namespace App\Modules\OpeningCash\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOpeningCashRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'business_date' => ['sometimes', 'required', 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
