<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttemptController extends Controller
{
    public function index()
    {
        $attempts = QuizAttempt::with('quiz')
            ->where('student_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate(10);

        return Inertia::render('student/Attempts/Index', [
            'attempts' => $attempts,
        ]);
    }

    public function show(QuizAttempt $attempt)
    {
        if ($attempt->student_id !== Auth::id()) {
            abort(403);
        }

        $attempt->load('quiz');
        $answers = $attempt->answers()
            ->with(['question.options', 'question.subject'])
            ->paginate(5);

        return Inertia::render('student/Attempts/Show', [
            'attempt' => $attempt,
            'answers' => $answers,
        ]);
    }

    public function resume(QuizAttempt $attempt)
    {
        if ($attempt->student_id !== $this->user()->id) {
            abort(403);
        }

        // Don't allow resuming completed quizzes
        if ($attempt->ended_at) {
            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('info', 'This quiz has already been completed.');
        }

        // Load the quiz and its questions, and the attempt's answers
        $attempt->load('answers');
        $quiz = $attempt->quiz()->with('questions.options')->first();
        $questions = $quiz->questions;

        // Get answered question IDs
        $answeredQuestionIds = $attempt->answers->pluck('question_id')->toArray();

        // Find the next unanswered question
        $nextIndex = $questions->search(function ($question) use ($answeredQuestionIds) {
            return ! in_array($question->id, $answeredQuestionIds);
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
