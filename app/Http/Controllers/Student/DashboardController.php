<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Subject;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $subjects = Subject::whereHas('quizzes.questions')->paginate(6);
        $mixedBagQuizzes = Quiz::where('mode', 'mixed_bag')
            ->whereHas('questions')
            ->with('subject')
            ->get();
        $lastAttempts = QuizAttempt::with('quiz.questions')
            ->where('student_id', Auth::id())
            ->orderByDesc('created_at')
            ->take(3)
            ->get();

        $unfinishedAttempts = QuizAttempt::with('quiz.questions')
            ->where('student_id', Auth::id())
            ->whereNull('ended_at')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        return Inertia::render('student/Dashboard', [
            'subjects' => $subjects,
            'mixedBagQuizzes' => $mixedBagQuizzes,
            'lastAttempts' => $lastAttempts,
            'unfinishedAttempts' => $unfinishedAttempts,
            'user' => [
                'name' => Auth::user()->name,
            ],
        ]);
    }

    public function quizzesBySubject($subjectId)
    {
        $subject = Subject::findOrFail($subjectId);
        $quizzes = Quiz::where('subject_id', $subjectId)
            ->whereHas('questions')
            ->with('questions:id')
            ->paginate(6);

        return Inertia::render('student/QuizzesBySubject', [
            'subject' => $subject,
            'quizzes' => $quizzes,
        ]);
    }
}
