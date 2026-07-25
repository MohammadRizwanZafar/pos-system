<?php

namespace App\Modules\OpeningCash\Services;

use App\Models\User;
use App\Modules\OpeningCash\Models\OpeningCash;
use Illuminate\Validation\ValidationException;

class OpeningCashService
{
    public function listOpeningCashes(
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $search = null,
        ?int $perPage = null
    ) {
        $query = OpeningCash::with('user:id,name')
            ->when($fromDate, fn ($q) => $q->where('business_date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->where('business_date', '<=', $toDate))
            ->when($search, fn ($q) => $q->where(function ($searchQuery) use ($search) {
                $searchQuery->where('note', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            }))
            ->orderByDesc('business_date')
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

    public function getForDate(string $date): ?OpeningCash
    {
        return OpeningCash::with('user:id,name')
            ->whereDate('business_date', $date)
            ->first();
    }

    public function upsertOpeningCash(User $user, array $data): OpeningCash
    {
        $existing = OpeningCash::whereDate('business_date', $data['business_date'])->first();

        if ($existing) {
            $existing->update([
                'amount' => $data['amount'],
                'note' => $data['note'] ?? $existing->note,
                'user_id' => $user->id,
            ]);

            return $existing->fresh('user');
        }

        return OpeningCash::create([
            'user_id' => $user->id,
            'business_date' => $data['business_date'],
            'amount' => $data['amount'],
            'note' => $data['note'] ?? null,
        ])->load('user');
    }

    public function updateOpeningCash(OpeningCash $openingCash, array $data): OpeningCash
    {
        if (isset($data['business_date'])) {
            $conflict = OpeningCash::whereDate('business_date', $data['business_date'])
                ->where('id', '!=', $openingCash->id)
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'business_date' => ['Opening cash for this date already exists.'],
                ]);
            }
        }

        $openingCash->update($data);

        return $openingCash->fresh('user');
    }

    public function deleteOpeningCash(OpeningCash $openingCash): void
    {
        $openingCash->delete();
    }
}
