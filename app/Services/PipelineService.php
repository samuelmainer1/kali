<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PipelineService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = Opportunity::query()
            ->where('reference', 'like', "OP-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('OP-%s-%04d', $year, $sequence);
    }

    public function canViewAll(User $user): bool
    {
        return $user->can('pipeline.view_all');
    }

    public function scopedQuery(User $user): Builder
    {
        $query = Opportunity::query();

        if ($user->can('pipeline.view_all')) {
            return $query;
        }

        return $query->ownedBy($user);
    }

    public function create(User $user, array $data): Opportunity
    {
        $opportunity = Opportunity::query()->create([
            ...$this->normalize($data),
            'reference' => $this->nextReference(),
            'created_by' => $user->id,
            'owner_id' => $data['owner_id'] ?? $user->id,
            'stage' => $data['stage'] ?? 'new_lead',
        ]);

        $this->applyClosureTimestamps($opportunity);
        $opportunity->save();

        $this->activityLog->log('pipeline.created', "Created opportunity {$opportunity->reference}", $opportunity);

        return $opportunity->fresh();
    }

    public function update(Opportunity $opportunity, array $data): Opportunity
    {
        if ($opportunity->isClosed() && ! request()->user()?->can('pipeline.view_all')) {
            throw ValidationException::withMessages([
                'stage' => 'Closed opportunities can only be edited by management.',
            ]);
        }

        $opportunity->fill($this->normalize($data));
        $this->applyClosureTimestamps($opportunity);
        $opportunity->save();

        $this->activityLog->log('pipeline.updated', "Updated opportunity {$opportunity->reference}", $opportunity);

        return $opportunity->fresh();
    }

    public function changeStage(Opportunity $opportunity, string $stage, ?string $lostReason = null): Opportunity
    {
        if (! in_array($stage, Opportunity::STAGES, true)) {
            throw ValidationException::withMessages(['stage' => 'Invalid pipeline stage.']);
        }

        if ($stage === 'lost' && blank($lostReason) && blank($opportunity->lost_reason)) {
            throw ValidationException::withMessages(['lost_reason' => 'Provide a lost reason.']);
        }

        $opportunity->stage = $stage;
        if ($stage === 'lost') {
            $opportunity->lost_reason = $lostReason ?: $opportunity->lost_reason;
        }
        if ($stage !== 'lost') {
            $opportunity->lost_reason = $stage === 'won' ? $opportunity->lost_reason : null;
        }

        $this->applyClosureTimestamps($opportunity);
        $opportunity->save();

        $this->activityLog->log('pipeline.stage_changed', "Opportunity {$opportunity->reference} → {$stage}", $opportunity);

        return $opportunity->fresh();
    }

    /**
     * @return array{subtitle: string, cards: list<array{label: string, value: string|int}>, follow_ups: list<array<string, mixed>>}
     */
    public function dashboardSummary(User $user): array
    {
        $query = $this->scopedQuery($user);
        $viewAll = $user->can('pipeline.view_all');

        $open = (clone $query)->open()->count();
        $overdue = (clone $query)->open()->whereDate('next_follow_up', '<', now()->toDateString())->count();
        $wonValue = (clone $query)->where('stage', 'won')->sum('expected_value');
        $closed = (clone $query)->whereIn('stage', ['won', 'lost'])->count();
        $won = (clone $query)->where('stage', 'won')->count();
        $conversion = $closed > 0 ? round(($won / $closed) * 100) : 0;

        $followUps = (clone $query)
            ->open()
            ->whereNotNull('next_follow_up')
            ->orderBy('next_follow_up')
            ->limit(5)
            ->get(['id', 'title', 'next_follow_up', 'stage']);

        return [
            'subtitle' => $viewAll ? 'Team pipeline overview' : 'Your open deals and follow-ups',
            'cards' => [
                ['label' => 'Open deals', 'value' => $open],
                ['label' => 'Overdue follow-ups', 'value' => $overdue],
                ['label' => 'Won value (KES)', 'value' => number_format((float) $wonValue, 0)],
                ['label' => $viewAll ? 'Conversion %' : 'Won deals', 'value' => $viewAll ? $conversion : $won],
            ],
            'follow_ups' => $followUps->map(fn (Opportunity $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'next_follow_up' => $item->next_follow_up?->toDateString(),
                'is_overdue' => $item->isOverdue(),
            ])->all(),
        ];
    }

    /**
     * @return Collection<int, array{owner: string, open: int, won: int, won_value: float|int, conversion: int}>
     */
    public function salespersonPerformance(): Collection
    {
        return Opportunity::query()
            ->with('owner:id,name')
            ->get()
            ->groupBy('owner_id')
            ->map(function (Collection $rows) {
                $owner = $rows->first()->owner;
                $won = $rows->where('stage', 'won');
                $closed = $rows->whereIn('stage', ['won', 'lost']);

                return [
                    'owner' => $owner?->name ?? 'Unassigned',
                    'open' => $rows->whereIn('stage', Opportunity::OPEN_STAGES)->count(),
                    'won' => $won->count(),
                    'won_value' => (float) $won->sum('expected_value'),
                    'lost' => $rows->where('stage', 'lost')->count(),
                    'conversion' => $closed->count() > 0
                        ? (int) round(($won->count() / $closed->count()) * 100)
                        : 0,
                ];
            })
            ->values();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        return [
            'title' => $data['title'],
            'customer_id' => $data['customer_id'],
            'owner_id' => $data['owner_id'],
            'stage' => $data['stage'] ?? 'new_lead',
            'expected_value' => $data['expected_value'] ?? 0,
            'currency' => $data['currency'] ?? 'KES',
            'next_follow_up' => $data['next_follow_up'] ?: null,
            'quotation_id' => $data['quotation_id'] ?: null,
            'notes' => $data['notes'] ?? null,
            'lost_reason' => (($data['stage'] ?? null) === 'lost') ? ($data['lost_reason'] ?? null) : null,
        ];
    }

    private function applyClosureTimestamps(Opportunity $opportunity): void
    {
        if ($opportunity->stage === 'won') {
            $opportunity->won_at ??= now();
            $opportunity->lost_at = null;
            $opportunity->lost_reason = null;
        } elseif ($opportunity->stage === 'lost') {
            $opportunity->lost_at ??= now();
            $opportunity->won_at = null;
        } else {
            $opportunity->won_at = null;
            $opportunity->lost_at = null;
        }
    }
}
