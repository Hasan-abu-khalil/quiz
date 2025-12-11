<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Subject;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $subjects = Subject::whereHas('quizzes.questions')->paginate(6);
        $lastAttempts = QuizAttempt::with('quiz')
            ->where('student_id', Auth::id())
            ->orderByDesc('created_at')
            ->take(3)
            ->get();

        return view('student.dashboard', compact('subjects', 'lastAttempts'));
    }

    public function quizzesBySubject($subjectId)
    {
        $subject = Subject::findOrFail($subjectId);
        $quizzes = Quiz::where('subject_id', $subjectId)
            ->whereHas('questions')
            ->paginate(6);
        return view('student.quizzes-by-subject', compact('subject', 'quizzes'));
    }

}
