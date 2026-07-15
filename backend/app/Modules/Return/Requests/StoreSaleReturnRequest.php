<?php

namespace App\Modules\Return\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'integer', 'distinct', 'exists:sale_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ];
    }
}
