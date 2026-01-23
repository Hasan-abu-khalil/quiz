<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FlaggedQuestionsController extends Controller
{
    /**
     * Display all flagged questions for the current student,
     * including the student's last answer for each question.
     */
    public function index(Request $request)
    {
        $user = $this->user();

        // Get all subjects that have flagged questions for this user
        $subjects = $user->flaggedQuestions()
            ->with('subject:id,name')
            ->get()
            ->pluck('subject')
            ->filter()
            ->unique('id')
            ->values()
            ->sortBy('name')
            ->values();

        // جلب الأسئلة الموسومة (flagged) لهذا الطالب
        $query = $user->flaggedQuestions()
            ->with(['subject:id,name', 'options']);

        // Filter by subject if provided
        if ($request->has('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        $flaggedQuestions = $query
            ->orderByDesc('question_flags.created_at')
            ->paginate(10)
            ->withQueryString();

        // تعديل البنية لإرسال بيانات إجابة الطالب لكل سؤال
        $questions = $flaggedQuestions->getCollection()->map(function ($question) use ($user) {
            // آخر إجابة للطالب لهذا السؤال
            $lastAnswer = $question->answers()
                ->whereHas('attempt', function ($q) use ($user) {
                    $q->where('student_id', $user->id);
                })
                ->latest()
                ->first();

            return [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'subject' => $question->subject,
                'options' => $question->options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'option_text' => $opt->option_text,
                        'is_correct' => $opt->is_correct,
                    ];
                }),
                'selected_option_id' => $lastAnswer?->selected_option_id,
                'is_correct' => $lastAnswer?->is_correct,
                'explanations' => $question->explanations,
            ];
        });

        return Inertia::render('student/Questions/Flagged', [
            'questions' => [
                'data' => $questions,
                'current_page' => $flaggedQuestions->currentPage(),
                'last_page' => $flaggedQuestions->lastPage(),
                'per_page' => $flaggedQuestions->perPage(),
                'total' => $flaggedQuestions->total(),
                'from' => $flaggedQuestions->firstItem(),
                'to' => $flaggedQuestions->lastItem(),
                'links' => $flaggedQuestions->linkCollection(),
                'prev_page_url' => $flaggedQuestions->previousPageUrl(),
                'next_page_url' => $flaggedQuestions->nextPageUrl(),
            ],
            'subjects' => $subjects,
            'filters' => [
                'subject_id' => $request->get('subject_id', 'all'),
            ],
        ]);
    }

    /**
     * Flag a question for the current student.
     */
    public function store(Request $request, Question $question)
    {
        $user = $this->user();

        if ($user->flaggedQuestions()->where('question_id', $question->id)->exists()) {
            if ($request->inertia()) {
                return redirect()->back()->with('info', 'Question is already flagged.');
            }

            return response()->json(['message' => 'Question is already flagged.'], 200);
        }

        $user->flaggedQuestions()->attach($question->id);

        if ($request->inertia()) {
            return redirect()->back()->with('success', 'Question flagged successfully.');
        }

        return response()->json(['success' => true, 'message' => 'Question flagged successfully.']);
    }

    /**
     * Unflag a question for the current student.
     */
    public function destroy(Request $request, Question $question)
    {
        $user = $this->user();

        $user->flaggedQuestions()->detach($question->id);

        if ($request->inertia()) {
            return redirect()->back()->with('success', 'Question unflagged successfully.');
        }

        return response()->json(['success' => true, 'message' => 'Question unflagged successfully.']);
    }
}
