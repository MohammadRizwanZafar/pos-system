<?php

namespace App\Modules\Shop\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreShopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:shops,slug'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_password' => ['required', 'string', 'min:6'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->slug && $this->name) {
            $this->merge([
                'slug' => Str::slug($this->name),
            ]);
        }
    }
}
