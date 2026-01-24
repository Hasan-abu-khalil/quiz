<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    /**
     * Show a single question for the quiz attempt.
     */
    public function take(QuizAttempt $attempt, $questionIndex = 0)
    {
        if ($attempt->student_id !== Auth::id()) {
            abort(403);
        }

        $quiz = $attempt->quiz()->with('questions.options', 'questions.subject', 'questions.tags')->first();
        $questions = $quiz->questions;

        // If index is out of bounds, mark attempt as completed
        if (! isset($questions[$questionIndex])) {
            $attempt->update([
                'ended_at' => now(),
                'score' => $attempt->answers()->where('is_correct', true)->count(),
            ]);

            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('success', 'Quiz completed!');
        }

        $question = $questions[$questionIndex];

        // Load existing answer if any
        $existingAnswer = $attempt->answers()->where('question_id', $question->id)->first();
        $selectedAnswer = $existingAnswer ? (string) $existingAnswer->selected_option_id : '';

        // Check if question is flagged by current user
        $isFlagged = Auth::user()->flaggedQuestions()->where('question_id', $question->id)->exists();

        return \Inertia\Inertia::render('student/Quizzes/Take', [
            'attempt' => $attempt,
            'question' => $question,
            'questionIndex' => $questionIndex,
            'questions' => $questions->map(fn ($q) => ['id' => $q->id]),
            'selectedAnswer' => $selectedAnswer,
            'isFlagged' => $isFlagged,
        ]);
    }

    /**
     * Submit a single question and redirect to the next question.
     */
    public function submitSingle(Request $request, QuizAttempt $attempt, $questionIndex)
    {
        if ($attempt->student_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'answer' => 'nullable|integer', // option_id
        ]);

        $quiz = $attempt->quiz()->with('questions.options')->first();
        $questions = $quiz->questions;
        $question = $questions[$questionIndex];

        $selectedOptionId = $request->input('answer');

        $correctOption = $question->options()->where('is_correct', true)->first();
        $isCorrect = $selectedOptionId && $correctOption && $selectedOptionId == $correctOption->id;

        // Save or update answer
        $attempt->answers()->updateOrCreate(
            ['question_id' => $question->id],
            [
                'selected_option_id' => $selectedOptionId,
                'is_correct' => $isCorrect,
            ]
        );

        // Recalculate stats after this answer
        $correctCount = $attempt->answers()->where('is_correct', true)->count();
        $totalAnswered = $attempt->answers()->count();
        $incorrectCount = $totalAnswered - $correctCount;

        $attempt->update([
            'score' => $correctCount,
            'total_correct' => $correctCount,
            'total_incorrect' => $incorrectCount,
        ]);

        // If this is the last question, mark attempt as completed
        if ($questionIndex + 1 >= $questions->count()) {
            $attempt->update(['ended_at' => now()]);

            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('success', 'Quiz completed!');
        }

        // Redirect to next question
        return redirect()->route('student.attempts.take.single', [$attempt->id, $questionIndex + 1]);
    }

    /**
     * Show quiz info page before starting the quiz.
     */
    public function show(Quiz $quiz)
    {
        $quiz->load('subject', 'questions:id');

        return \Inertia\Inertia::render('student/Quizzes/Show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'mode' => $quiz->mode,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'subject' => $quiz->subject,
                'questions' => $quiz->questions->map(fn ($q) => ['id' => $q->id]),
                'total_questions' => $quiz->total_questions,
            ],
        ]);
    }

    /**
     * Start a new quiz attempt.
     */
    public function start(Request $request, Quiz $quiz)
    {
        $user = Auth::user();

        // Check if quiz has questions - check both total_questions and relationship
        $quiz->load('questions');
        if ($quiz->total_questions === 0 || $quiz->questions->isEmpty()) {
            // Always use Inertia redirect for student routes (they're all Inertia now)
            return redirect()->back()
                ->with('error', 'This quiz has no questions and cannot be started.');
        }

        // create new attempt
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'student_id' => $user->id,
            'started_at' => now(),
            'ended_at' => null,
            'score' => 0,
            'total_correct' => 0,
            'total_incorrect' => 0,
        ]);

        return redirect()->route('student.attempts.take.single', [$attempt->id, 0]);
    }
}
