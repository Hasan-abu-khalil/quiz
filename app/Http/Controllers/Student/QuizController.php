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

        if (!isset($questions[$questionIndex])) {
            $attempt->update([
                'ended_at' => now(),
                'score' => $attempt->answers()->where('is_correct', true)->count(),
            ]);

            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('success', 'Quiz completed!');
        }

        $question = $questions[$questionIndex];
        $existingAnswer = $attempt->answers()->where('question_id', $question->id)->first();
        $selectedAnswer = $existingAnswer ? (string) $existingAnswer->selected_option_id : '';
        $isFlagged = Auth::user()->flaggedQuestions()->where('question_id', $question->id)->exists();

        // ⬅ التعامل مع المؤقت لجميع الحالات
        if ($attempt->ends_at) {
            $endsAtTimestamp = $attempt->ends_at->timestamp;
        } elseif ($quiz->time_limit_minutes && $quiz->time_limit_minutes > 0) {
            $endsAtTimestamp = now()->addMinutes($quiz->time_limit_minutes)->timestamp;
            $attempt->update(['ends_at' => now()->addMinutes($quiz->time_limit_minutes)]);
        } else {
            $endsAtTimestamp = null; // الاختبار بدون وقت
        }



        $explanations = $question->explanations ?? null;
        $showExplanationAll = $question->pivot->show_explanation ?? false;
        return \Inertia\Inertia::render('student/Quizzes/Take', [
            'attempt' => $attempt,
            'question' => $question,
            'questionIndex' => $questionIndex,
            'questions' => $questions->map(fn($q) => [
                'id' => $q->id,
                'show_explanation' => $q->pivot->show_explanation ?? false,
            ]),
            'selectedAnswer' => $selectedAnswer,
            'isFlagged' => $isFlagged,
            'ends_at_timestamp' => $endsAtTimestamp,
            'explanations' => $question->explanations,
            'showExplanationAll' => $showExplanationAll,
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
            'answer' => 'nullable|integer',
        ]);

        $quiz = $attempt->quiz()->with('questions.options')->first();
        $questions = $quiz->questions;
        $question = $questions[$questionIndex];

        $selectedOptionId = $request->input('answer');

        $correctOption = $question->options()->where('is_correct', true)->first();
        $isCorrect = $selectedOptionId && $correctOption && $selectedOptionId == $correctOption->id;

        $attempt->answers()->updateOrCreate(
            ['question_id' => $question->id],
            [
                'selected_option_id' => $selectedOptionId,
                'is_correct' => $isCorrect,
            ]
        );

        // Recalculate stats
        $correctCount = $attempt->answers()->where('is_correct', true)->count();
        $totalAnswered = $attempt->answers()->count();
        $incorrectCount = $totalAnswered - $correctCount;

        $attempt->update([
            'score' => $correctCount,
            'total_correct' => $correctCount,
            'total_incorrect' => $incorrectCount,
        ]);

        // If last question, complete attempt
        if ($questionIndex + 1 >= $questions->count()) {
            $attempt->update(['ended_at' => now()]);

            return redirect()->route('student.attempts.show', $attempt->id)
                ->with('success', 'Quiz completed!');
        }

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
                'questions' => $quiz->questions->map(fn($q) => ['id' => $q->id]),
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
        $totalTimeSeconds = $quiz->time_limit_minutes * 60;

        // create new attempt
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'student_id' => $user->id,
            'started_at' => now(),
            'ends_at' => now()->addSeconds($totalTimeSeconds),
            'score' => 0,
            'total_correct' => 0,
            'total_incorrect' => 0,
        ]);

        return redirect()->route('student.attempts.take.single', [$attempt->id, 0]);
    }
}

