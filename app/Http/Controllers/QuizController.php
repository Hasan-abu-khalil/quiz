<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        if ($this->wantsInertiaResponse($request)) {
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
                        'timed' => 'Timed',
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


    public function create(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'mode' => 'required|in:by_subject,mixed_bag,timed',
            'subject_id' => 'nullable|exists:subjects,id',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'total_questions' => 'nullable|integer|min:1',
            'questions' => [
                'required',
                'array',
                'size:' . $request->total_questions,
            ],
            'questions.*.question_id' => 'required|exists:questions,id',
            'questions.*.order' => 'required|integer|min:1',
        ]);

        // Validate that all questions are in "done" state
        if ($request->has('questions') && is_array($request->questions)) {
            $questionIds = array_column($request->questions, 'question_id');
            $nonDoneQuestions = \App\Models\Question::whereIn('id', $questionIds)
                ->where('state', '!=', \App\Models\Question::STATE_DONE)
                ->pluck('id')
                ->toArray();

            if (!empty($nonDoneQuestions)) {
                return back()->withErrors([
                    'questions' => 'Only questions that are marked as done can be added to quizzes.',
                ])->withInput();
            }
        }

        $quiz = Quiz::create([
            'title' => $request->title,
            'mode' => $request->mode,
            'subject_id' => $request->subject_id,
            'time_limit_minutes' => $request->time_limit_minutes,
            'total_questions' => $request->total_questions,
            'created_by' => Auth::id(),
        ]);

        foreach ($request->questions as $q) {
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question_id' => $q['question_id'],
                'order' => $q['order'],
            ]);
        }

        // For Inertia requests
        if ($this->wantsInertiaResponse($request)) {
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

        return response()->json(['quiz' => $quiz]);
    }

    public function edit($id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['error' => 'Quiz not found'], 404);
        }

        return response()->json($quiz);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            abort(404, 'Quiz not found');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'mode' => 'required|in:by_subject,mixed_bag,timed',
            'subject_id' => 'nullable|exists:subjects,id',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'total_questions' => 'nullable|integer|min:1',
        ]);

        $quiz->title = $request->title;
        $quiz->mode = $request->mode;
        $quiz->subject_id = $request->subject_id;
        $quiz->time_limit_minutes = $request->time_limit_minutes;
        $quiz->total_questions = $request->total_questions;
        $quiz->save();

        // For Inertia requests
        if ($this->wantsInertiaResponse($request)) {
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
        if ($this->wantsInertiaResponse(request())) {
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

        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.quizzes.index')
                ->with('success', "{$deleted} quiz(zes) deleted successfully");
        }

        return response()->json(['success' => "{$deleted} quiz(zes) deleted successfully"]);
    }
}
