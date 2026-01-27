<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    /** @use HasFactory<\Database\Factories\QuizFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'created_by',
        'mode',
        'subject_id',
        'time_limit_minutes',
        'total_questions',
        'show_explanation',
    ];
    protected $casts = [
        'show_explanation' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function adaptiveAssignment()
    {
        return $this->hasOne(AdaptiveQuizAssignment::class);
    }

    // public function questions()
    // {
    //     return $this->belongsToMany(Question::class)->withTimestamps();
    // }

    public function questions()
    {
        // explicit pivot table and keys
        return $this->belongsToMany(Question::class, 'quiz_questions', 'quiz_id', 'question_id')
            ->withPivot('order')
            ->orderBy('quiz_questions.order')
            ->withTimestamps();
    }

    public function quizQuestion()
    {
        return $this->hasMany(QuizQuestion::class)->with('question')->orderBy('order');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get adaptive quizzes generated for a specific student
     */
    public static function getAdaptiveQuizzesForStudent($studentId)
    {
        return self::where('mode', 'adaptive')
            ->whereHas('adaptiveAssignment', function ($q) use ($studentId) {
                $q->where('target_student_id', $studentId);
            })
            ->with(['adaptiveAssignment', 'subject', 'questions'])
            ->get();
    }

    /**
     * Get adaptive quizzes available for challenge (from other students)
     */
    public static function getAvailableChallenges($currentStudentId, $filters = [])
    {
        $query = self::where('mode', 'adaptive')
            ->whereHas('adaptiveAssignment', function ($q) use ($currentStudentId) {
                $q->where('target_student_id', '!=', $currentStudentId);
            })
            ->with(['adaptiveAssignment.targetStudent', 'subject', 'questions']);

        // Apply filters
        if (isset($filters['strategy'])) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($filters) {
                $q->where('strategy', $filters['strategy']);
            });
        }

        if (isset($filters['subject_id'])) {
            $query->where('subject_id', $filters['subject_id']);
        }

        if (isset($filters['target_student_id'])) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($filters) {
                $q->where('target_student_id', $filters['target_student_id']);
            });
        }

        return $query;
    }

    /**
     * Get leaderboard for this quiz
     */
    public function getLeaderboard()
    {
        return $this->attempts()
            ->with('student:id,name')
            ->orderByDesc('score')
            ->orderBy('ended_at')
            ->get()
            ->map(function ($attempt, $index) {
                return [
                    'rank' => $index + 1,
                    'student_id' => $attempt->student_id,
                    'student_name' => $attempt->student->name,
                    'score' => $attempt->score,
                    'total_questions' => $this->total_questions,
                    'percentage' => $this->total_questions > 0
                        ? round(($attempt->score / $this->total_questions) * 100, 2)
                        : 0,
                    'attempted_at' => $attempt->ended_at ?? $attempt->started_at,
                ];
            });
    }
}
