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
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
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
}
