<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;

class AttemptController extends Controller
{
    public function index()
    {
        $attempts = QuizAttempt::with('quiz')
            ->where('student_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate(10); 

        return view('student.attempts-index', compact('attempts'));
    }

    public function show(QuizAttempt $attempt)
    {
        if ($attempt->student_id !== Auth::id()) {
            abort(403);
        }

        $attempt->load(['quiz', 'answers.question.options']);
        $answers = $attempt->answers()->paginate(5); 

        return view('student.attempts-show', compact('attempt', 'answers'));
    }

    public function resume(QuizAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403);
        }

        // Load the quiz and its questions
        $quiz = $attempt->quiz()->with('questions.options')->first();
        $questions = $quiz->questions;

        // Find the next unanswered question
        $nextIndex = $questions->search(function ($question) use ($attempt) {
            return !$attempt->answers->contains('question_id', $question->id);
        });

        // If all questions are answered, mark as finished
        if ($nextIndex === false) {
            $attempt->update(['ended_at' => now()]);

            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('success', 'Quiz already completed!');
        }

        // Redirect to the next unanswered question
        return redirect()->route('student.attempts.take.single', [$attempt->id, $nextIndex]);
    }
}
