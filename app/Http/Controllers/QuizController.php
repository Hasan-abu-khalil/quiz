<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Log;
use Yajra\DataTables\DataTables;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Quiz::with('subject');

        // Teachers can only see their own quizzes
        if ($user && $user->hasRole('teacher') && !$user->hasRole('admin')) {
            $query->where('created_by', $user->id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }
        $quizzes = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        // For Inertia requests, return Inertia response
        if ($request->inertia($request)) {
            return \Inertia\Inertia::render('admin/Quizzes/Index', [
                'quizzes' => $quizzes,
                'subjects' => Subject::select('id', 'name')->get(),
                'questions' => \App\Models\Question::where('state', \App\Models\Question::STATE_DONE)
                    ->select('id', 'question_text')
                    ->get(),
                'filters' => $request->only(['search']),
            ]);
        }

        // Check if this is an AJAX request (DataTables) - but NOT Inertia
        if ($this->isDataTablesRequest($request)) {
            $data = Quiz::with(['subject']);

            return DataTables::of($data)
                ->addIndexColumn()
                ->addColumn('subject_name', function ($row) {
                    return $row->subject ? $row->subject->name : '-';
                })

                ->editColumn('mode', function ($row) {
                    return match ($row->mode) {
                        'by_subject' => 'By Subject',
                        'mixed_bag' => 'Mixed Bag',
                        'adaptive' => 'Adaptive',
                        default => $row->mode,
                    };
                })
                ->addColumn('action', function ($row) {
                    return '
                    <div class="d-grid gap-2 d-md-block">
                        <a href="javascript:void(0)" class="btn btn-info view" data-id="' . $row->id . '" title="View">View</a>

                        <a href="javascript:void(0)" class="btn btn-primary edit-quiz" data-id="' . $row->id . '" title="Edit">
                            <i class="fas fa-pencil-alt"></i>
                        </a>

                        <a href="javascript:void(0)" class="btn btn-danger delete-quiz" data-id="' . $row->id . '" title="Delete">
                            <i class="fas fa-trash"></i>
                        </a>
                    </div>';
                })
                ->rawColumns(['action'])
                ->make(true);
        }

        // Fallback to Blade view for legacy routes
        $subjects = Subject::select('id', 'name')->get();

        return view('Dashboard/Quiz/quiz', compact('subjects'));
    }

    public function createForm(Request $request)
    {
        if ($request->inertia($request)) {
            return \Inertia\Inertia::render('admin/Quizzes/Create', [
                'subjects' => Subject::select('id', 'name')->get(),
                'questions' => \App\Models\Question::where('state', \App\Models\Question::STATE_DONE)
                    ->select('id', 'question_text')
                    ->get(),
            ]);
        }

        // Legacy fallback
        $subjects = Subject::select('id', 'name')->get();

        return view('Dashboard/Quiz/quiz', compact('subjects'));
    }

    public function create(Request $request)
    {
        $rules = [
            'title' => 'required|string|max:255',
            'mode' => 'required|in:by_subject,mixed_bag,adaptive',
            'subject_id' => 'nullable|exists:subjects,id',
            'questions' => 'required|array|min:1',
            'questions.*.question_id' => 'required|exists:questions,id',
            'questions.*.order' => 'required|integer|min:1',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'show_explanation' => 'required|boolean',
        ];

        // For mixed_bag mode, total_questions is required and must match questions count
        if ($request->mode === 'mixed_bag') {
            $rules['total_questions'] = 'required|integer|min:1';
            // Convert questions rule to array to append size rule
            $rules['questions'] = array_merge(
                explode('|', $rules['questions']),
                ['size:' . $request->total_questions]
            );
        } else {
            // For by_subject mode, total_questions is inferred from questions count
            $rules['total_questions'] = 'nullable|integer|min:1';
        }

        $request->validate($rules);

        // Validate that all questions are in "done" state
        if ($request->has('questions') && is_array($request->questions)) {
            $questionIds = array_column($request->questions, 'question_id');
            $nonDoneQuestions = \App\Models\Question::whereIn('id', $questionIds)
                ->where('state', '!=', \App\Models\Question::STATE_DONE)
                ->pluck('id')
                ->toArray();

            if (!empty($nonDoneQuestions)) {
                if ($request->inertia($request)) {
                    return $this->redirectWithError(
                        $request,
                        'admin.quizzes.edit',
                        'Only questions that are marked as done can be added to quizzes.',
                        ['id' => $id]
                    );
                }

                return back()->withErrors([
                    'questions' => 'Only questions that are marked as done can be added to quizzes.',
                ])->withInput();
            }
        }

        // For by_subject mode, set total_questions from questions count
        $totalQuestions = $request->mode === 'by_subject'
            ? count($request->questions)
            : $request->total_questions;

        $showExplanation = filter_var($request->input('show_explanation'), FILTER_VALIDATE_BOOLEAN);

        $quiz = Quiz::create([
            'title' => $request->title,
            'mode' => $request->mode,
            'subject_id' => $request->subject_id,
            'total_questions' => $totalQuestions,
            'time_limit_minutes' => $request->time_limit_minutes,
            'show_explanation' => $showExplanation, // true or false
            'created_by' => Auth::id(),
        ]);

        Log::info('Saved quiz:', [
            'id' => $quiz->id,
            'show_explanation' => $quiz->show_explanation,
            'raw_request' => $request->all()
        ]);
        foreach ($request->questions as $q) {
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question_id' => $q['question_id'],
                'order' => $q['order'],
                'show_explanation' => $q['show_explanation'] ?? false,
            ]);
        }

        // For Inertia requests
        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.quizzes.index')
                ->with('success', 'Quiz created successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Quiz saved successfully', 'quiz' => $quiz]);
    }

    public function storeQuestion(Request $request, $quizId)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
        ]);

        $quiz = Quiz::findOrFail($quizId);

        // Check if question is in "done" state
        $question = \App\Models\Question::findOrFail($request->question_id);
        if ($question->state !== \App\Models\Question::STATE_DONE) {
            return response()->json([
                'error' => 'Only questions that are marked as done can be added to quizzes.',
            ], 422);
        }

        $quizQuestion = QuizQuestion::create([
            'quiz_id' => $quiz->id,
            'question_id' => $request->question_id,
            'order' => $quiz->quizQuestion()->count() + 1,
        ]);

        return response()->json([
            'success' => 'Question added successfully',
            'quiz_question_id' => $quizQuestion->id,
        ]);
    }

    public function updateQuestion(Request $request, $quizId, $questionId)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
        ]);

        $quizQuestion = QuizQuestion::where('quiz_id', $quizId)
            ->where('id', $questionId)
            ->firstOrFail();

        $quizQuestion->question_id = $request->question_id;
        $quizQuestion->save();

        return response()->json(['success' => 'Question updated successfully']);
    }

    public function updateOrder(Request $request, Quiz $quiz, QuizQuestion $quizQuestion)
    {
        $request->validate([
            'new_order' => 'required|integer|min:1',
        ]);

        $newOrder = $request->input('new_order');

        // Swap orders if needed
        $existing = QuizQuestion::where('quiz_id', $quiz->id)
            ->where('order', $newOrder)
            ->first();

        if ($existing) {
            $existing->order = $quizQuestion->order;
            $existing->save();
        }

        $quizQuestion->order = $newOrder;
        $quizQuestion->save();

        return response()->json(['message' => 'Order updated successfully']);
    }

    public function destroyQuestion($quizId, $questionId)
    {
        $quizQuestion = QuizQuestion::where('quiz_id', $quizId)
            ->where('id', $questionId)
            ->first();

        if (!$quizQuestion) {
            return response()->json(['error' => 'Question not found'], 404);
        }

        $quizQuestion->delete();

        return response()->json(['success' => 'Question deleted successfully']);
    }

    public function show($id)
    {
        $quiz = Quiz::with(['subject', 'quizQuestion.question'])->findOrFail($id);

        $quiz->questions = $quiz->quizQuestion;
        unset($quiz->quizQuestion);

        if (request()->inertia()) {
            return \Inertia\Inertia::render('admin/Quizzes/Show', [
                'quiz' => $quiz,
            ]);
        }

        return response()->json(['quiz' => $quiz]);
    }

    public function edit($id)
    {
        $quiz = Quiz::with(['subject', 'quizQuestion.question'])->findOrFail($id);

        if (request()->inertia()) {
            $quiz->questions = $quiz->quizQuestion;
            unset($quiz->quizQuestion);

            return \Inertia\Inertia::render('admin/Quizzes/Edit', [
                'quiz' => $quiz,
                'subjects' => Subject::select('id', 'name')->get(),
                'questions' => \App\Models\Question::where('state', \App\Models\Question::STATE_DONE)
                    ->select('id', 'question_text')
                    ->get(),
            ]);
        }

        return response()->json($quiz);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            abort(404, 'Quiz not found');
        }

        $rules = [
            'title' => 'required|string|max:255',
            'mode' => 'required|in:by_subject,mixed_bag',
            'subject_id' => 'nullable|exists:subjects,id',
            'time_limit_minutes' => 'nullable|integer|min:1',
        ];

        // For mixed_bag mode, total_questions is required
        if ($request->mode === 'mixed_bag') {
            $rules['total_questions'] = 'required|integer|min:1';
        } else {
            $rules['total_questions'] = 'nullable|integer|min:1';
        }

        $request->validate($rules);

        // For by_subject mode, set total_questions from current questions count
        $totalQuestions = $request->mode === 'by_subject'
            ? $quiz->quizQuestion()->count()
            : $request->total_questions;

        $quiz->title = $request->title;
        $quiz->mode = $request->mode;
        $quiz->subject_id = $request->subject_id;
        $quiz->total_questions = $totalQuestions;
        $quiz->time_limit_minutes = $request->time_limit_minutes;
        $quiz->save();

        // For Inertia requests
        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.quizzes.index')
                ->with('success', 'Quiz updated successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Quiz updated successfully']);
    }

    public function destroy($id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            abort(404, 'Quiz not found');
        }

        $quiz->delete();

        // For Inertia requests
        if (request()->inertia()) {
            return redirect()
                ->route('admin.quizzes.index')
                ->with('success', 'Quiz deleted successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Quiz deleted successfully']);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:quizzes,id',
        ]);

        $ids = $request->ids;
        $deleted = Quiz::whereIn('id', $ids)->delete();

        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.quizzes.index')
                ->with('success', "{$deleted} quiz(zes) deleted successfully");
        }

        return response()->json(['success' => "{$deleted} quiz(zes) deleted successfully"]);
    }

    /**
     * Browse adaptive quizzes generated by students
     */
    public function adaptiveQuizzes(Request $request)
    {
        $query = Quiz::where('mode', 'adaptive')
            ->whereHas('adaptiveAssignment')
            ->with([
                'adaptiveAssignment.targetStudent:id,name',
                'subject:id,name',
                'attempts:id,quiz_id',
                'creator:id,name',
            ]);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('adaptiveAssignment.targetStudent', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('creator', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('strategy') && $request->strategy) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($request) {
                $q->where('strategy', $request->strategy);
            });
        }

        if ($request->has('target_student_id') && $request->target_student_id) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($request) {
                $q->where('target_student_id', $request->target_student_id);
            });
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        $quizzes = $query->orderByDesc('created_at')->paginate(15);

        $quizzes->getCollection()->transform(function ($quiz) {
            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'total_questions' => $quiz->total_questions,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'created_at' => $quiz->created_at,
                'subject' => $quiz->subject ? [
                    'id' => $quiz->subject->id,
                    'name' => $quiz->subject->name,
                ] : null,
                'target_student' => $quiz->adaptiveAssignment && $quiz->adaptiveAssignment->targetStudent ? [
                    'id' => $quiz->adaptiveAssignment->targetStudent->id,
                    'name' => $quiz->adaptiveAssignment->targetStudent->name,
                ] : null,
                'creator' => $quiz->creator ? [
                    'id' => $quiz->creator->id,
                    'name' => $quiz->creator->name,
                ] : null,
                'strategy' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->strategy : null,
                'subject_ids' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->subject_ids : null,
                'attempt_count' => $quiz->attempts->count(),
            ];
        });

        $strategies = [
            'worst_performing' => 'Worst Performing',
            'never_attempted' => 'Never Attempted',
            'recently_incorrect' => 'Review Incorrect',
            'weak_subjects' => 'Weak Subjects',
            'mixed' => 'Random Questions',
        ];

        $subjects = Subject::orderBy('name')->get(['id', 'name']);
        $targetStudents = User::whereHas('adaptiveQuizzes')->orderBy('name')->get(['id', 'name'])->unique('id')->values();

        return \Inertia\Inertia::render('admin/Quizzes/Adaptive', [
            'quizzes' => $quizzes,
            'strategies' => $strategies,
            'subjects' => $subjects,
            'targetStudents' => $targetStudents,
            'filters' => $request->only(['search', 'strategy', 'target_student_id', 'subject_id']),
        ]);
    }
}
