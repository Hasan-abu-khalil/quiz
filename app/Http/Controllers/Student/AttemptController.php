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

        $attempt->load(['quiz']);

        // Load all quiz questions to ensure we have all questions even if not answered
        $quiz = $attempt->quiz()->with('questions.options', 'questions.subject')->first();
        $allQuestions = $quiz->questions->keyBy('id');

        // Get all answers for this attempt with question relationships
        $allAnswers = $attempt->answers()
            ->with(['question.options', 'question.subject'])
            ->get()
            ->keyBy('question_id');

        // Get flagged question IDs for current user
        $user = $this->user();
        $flaggedQuestionIds = $user
            ->flaggedQuestions()
            ->pluck('question_id')
            ->toArray();

        // Create minimal question index for navigation (id, index, page, answered status)
        $perPage = 5;
        $totalQuestions = $allQuestions->count();
        $questionsIndex = $allQuestions->map(function ($question, $index) use ($allAnswers, $perPage) {
            $answer = $allAnswers->get($question->id);
            $page = (int) floor($index / $perPage) + 1;

            // A question is answered if there's an answer record AND selected_option_id is not null
            // If selected_option_id is null, the student skipped the question
            $isAnswered = $answer !== null && $answer->selected_option_id !== null;

            return [
                'id' => $question->id,
                'index' => $index + 1, // 1-based index
                'page' => $page,
                'is_answered' => $isAnswered,
                'is_correct' => $isAnswered ? $answer->is_correct : null,
            ];
        })->values();

        // Combine questions with answers for current page only
        $currentPage = request()->get('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        $currentPageQuestions = $allQuestions->slice($offset, $perPage);

        $combined = $currentPageQuestions->map(function ($question) use ($allAnswers, $flaggedQuestionIds) {
            $answer = $allAnswers->get($question->id);

            return [
                'id' => $answer ? $answer->id : null,
                'question_id' => $question->id,
                'question' => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'subject' => $question->subject ? [
                        'id' => $question->subject->id,
                        'name' => $question->subject->name,
                    ] : null,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                        ];
                    })->toArray(),
                    'explanations' => $question->explanations,
                ],
                'selected_option_id' => $answer ? $answer->selected_option_id : null,
                'is_correct' => $answer ? $answer->is_correct : null,
                'is_flagged' => in_array($question->id, $flaggedQuestionIds),
            ];
        })->values();

        $answers = new \Illuminate\Pagination\LengthAwarePaginator(
            $combined,
            $totalQuestions,
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return Inertia::render('student/Attempts/Show', [
            'attempt' => $attempt,
            'answers' => $answers,
            'questions_index' => $questionsIndex, // Minimal data for navigation
        ]);
    }

    public function resume(QuizAttempt $attempt)
    {
        if ($attempt->student_id !== $this->user()->id) {
            abort(403);
        }

        // Load the quiz and its questions
        $quiz = $attempt->quiz()->with('questions.options')->first();
        $questions = $quiz->questions;

        // Find the next unanswered question
        $nextIndex = $questions->search(function ($question) use ($attempt) {
            return ! $attempt->answers->contains('question_id', $question->id);
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
