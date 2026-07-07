<?php

namespace App\Modules\Setting\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'store_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'currency_symbol' => ['nullable', 'string', 'max:10'],
            'receipt_footer' => ['nullable', 'string'],
        ];
    }
}
