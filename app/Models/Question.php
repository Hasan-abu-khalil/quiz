<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory;

    const STATE_INITIAL = 'initial';

    const STATE_UNDER_REVIEW = 'under-review';

    const STATE_DONE = 'done';

    protected $fillable = [
        'subject_id',
        'question_text',
        'explanations',
        'created_by',
        'state',
        'assigned_to',
    ];

    protected $casts = [
        'explanations' => 'array',
    ];

    protected $attributes = [
        'state' => self::STATE_INITIAL,
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'question_tags');
    }

    public function stateHistory()
    {
        return $this->hasMany(QuestionStateHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Check if question can be assigned (must be in initial state)
     */
    public function canBeAssigned(): bool
    {
        return $this->state === self::STATE_INITIAL;
    }

    /**
     * Assign question to a user (teacher self-assignment)
     */
    public function assignTo(int $userId): bool
    {
        if (! $this->canBeAssigned()) {
            return false;
        }

        $this->assigned_to = $userId;
        $this->state = self::STATE_UNDER_REVIEW;
        $this->save();

        // Log state change
        $this->logStateChange(self::STATE_INITIAL, self::STATE_UNDER_REVIEW, $userId);

        return true;
    }

    /**
     * Check if question can be unassigned
     */
    public function canBeUnassigned(int $userId, bool $isAdmin): bool
    {
        // Must be assigned to someone
        if (! $this->assigned_to) {
            return false;
        }

        // Must be in under-review state
        if ($this->state !== self::STATE_UNDER_REVIEW) {
            return false;
        }

        // User must be assigned to it OR be an admin
        return $this->assigned_to === $userId || $isAdmin;
    }

    /**
     * Unassign question (set back to initial state)
     */
    public function unassign(int $changedBy): bool
    {
        if (! $this->assigned_to) {
            return false;
        }

        $fromState = $this->state;
        $this->assigned_to = null;
        $this->state = self::STATE_INITIAL;
        $this->save();

        // Log state change
        $this->logStateChange($fromState, self::STATE_INITIAL, $changedBy, 'Question unassigned');

        return true;
    }

    /**
     * Change state and log the change
     */
    public function changeState(string $newState, ?string $notes = null): bool
    {
        $validStates = [self::STATE_INITIAL, self::STATE_UNDER_REVIEW, self::STATE_DONE];
        if (! in_array($newState, $validStates)) {
            return false;
        }

        $fromState = $this->state;
        $this->state = $newState;
        $this->save();

        // Log state change
        $this->logStateChange($fromState, $newState, Auth::id(), $notes);

        return true;
    }

    /**
     * Log state change to history
     */
    protected function logStateChange(?string $fromState, string $toState, int $changedBy, ?string $notes = null): void
    {
        QuestionStateHistory::create([
            'question_id' => $this->id,
            'from_state' => $fromState,
            'to_state' => $toState,
            'changed_by' => $changedBy,
            'notes' => $notes,
        ]);
    }
}
