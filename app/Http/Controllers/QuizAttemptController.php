<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Yajra\DataTables\DataTables;

class QuizAttemptController extends Controller
{
    public function index(Request $request)
    {
        // Start the query
        $query = QuizAttempt::with(['quiz', 'student'])->orderBy('created_at', 'desc');

        // Apply search if provided
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('quiz', fn($q) => $q->where('title', 'like', "%{$search}%"))
                ->orWhereHas('student', fn($q) => $q->where('name', 'like', "%{$search}%"));
        }

        // Paginate and map
        $attempts = $query->paginate(10)->withQueryString()->through(fn($attempt) => [
            'id' => $attempt->id,
            'quiz_id' => $attempt->quiz_id,
            'student_id' => $attempt->student_id,
            'started_at' => $attempt->started_at,
            'ended_at' => $attempt->ended_at,
            'score' => $attempt->score,
            'total_correct' => $attempt->total_correct,
            'total_incorrect' => $attempt->total_incorrect,
            'total_questions' => $attempt->quiz?->questions()->count() ?? 0,
            'quiz' => $attempt->quiz ? [
                'id' => $attempt->quiz->id,
                'title' => $attempt->quiz->title,
            ] : null,
            'student' => $attempt->student ? [
                'id' => $attempt->student->id,
                'name' => $attempt->student->name,
                'email' => $attempt->student->email,
            ] : null,
        ]);

        return \Inertia\Inertia::render('admin/Attempts/Index', [
            'attempts' => $attempts,
            'filters' => $request->only(['search']),
        ]);

        // Check if this is an AJAX request (DataTables) - but NOT Inertia
        if ($this->isDataTablesRequest($request)) {
            $data = QuizAttempt::with(['quiz', 'student']);

            return DataTables::of($data)
                ->addIndexColumn()
                ->addColumn('quiz_title', fn($row) => $row->quiz ? $row->quiz->title : '')
                ->addColumn('student_name', fn($row) => $row->student ? $row->student->name : '')
                ->addColumn('score', function ($row) {
                    $totalQuestions = $row->quiz?->questions->count() ?? 0;

                    return $row->score . ' / ' . $totalQuestions;
                })
                ->addColumn('action', function ($row) {
                    return '
                         <div class="d-grid gap-2 d-md-block">
                    <a href="javascript:void(0)" class="btn btn-info  view" data-id="' . $row->id . '" data-toggle="tooltip" title="View">View</a>

                     <a href="javascript:void(0)" class="edit-attempt btn btn-primary btn-action " data-id="' . $row->id . '" data-toggle="tooltip" title="Edit">
                      <i class="fas fa-pencil-alt"></i>
                     </a>

                    <a href="javascript:void(0)" class="delete-attempt btn btn-danger  " data-id="' . $row->id . '" data-toggle="tooltip" title="Delete">
                      <i class="fas fa-trash"></i>
                      </a>
                     </div>
                    ';
                })
                ->rawColumns(['action'])
                ->make(true);
        }

        // Fallback to Blade view for legacy routes
        $quizzes = Quiz::select('id', 'title')->get();
        $students = User::select('id', 'name')->get();

        return view('Dashboard/Quiz-Attempt/attempt', compact('quizzes', 'students'));
    }

    public function create(Request $request)
    {
        $attempt = QuizAttempt::create([
            'quiz_id' => $request->quiz_id,
            'student_id' => $request->student_id,
            'started_at' => $request->started_at ? date('Y-m-d H:i:s', strtotime($request->started_at)) : null,
            'ended_at' => $request->ended_at ? date('Y-m-d H:i:s', strtotime($request->ended_at)) : null,
            'score' => $request->score ?? 0,
            'total_correct' => $request->total_correct ?? 0,
            'total_incorrect' => $request->total_incorrect ?? 0,
        ]);

        return response()->json(['success' => 'Quiz Attempt created successfully']);
    }

    public function show($id)
    {
        $attempt = QuizAttempt::with([
            'quiz',
            'student',
            'answers.question',
            'answers.selectedOption',
        ])->find($id);

        if (!$attempt) {
            abort(404, 'Quiz Attempt not found');
        }

        // For Inertia requests
        if ($this->wantsInertiaResponse(request())) {
            $answers = $attempt->answers->map(function ($answer) {
                return [
                    'id' => $answer->id,
                    'question_id' => $answer->question_id,
                    'selected_option_id' => $answer->selected_option_id,
                    'is_correct' => $answer->is_correct,
                    'question' => $answer->question ? [
                        'id' => $answer->question->id,
                        'question_text' => $answer->question->question_text,
                    ] : null,
                    'selected_option' => $answer->selectedOption ? [
                        'id' => $answer->selectedOption->id,
                        'option_text' => $answer->selectedOption->option_text,
                    ] : null,
                ];
            });

            return \Inertia\Inertia::render('admin/Attempts/Show', [
                'attempt' => [
                    'id' => $attempt->id,
                    'quiz_id' => $attempt->quiz_id,
                    'student_id' => $attempt->student_id,
                    'started_at' => $attempt->started_at,
                    'ended_at' => $attempt->ended_at,
                    'score' => $attempt->score,
                    'total_correct' => $attempt->total_correct,
                    'total_incorrect' => $attempt->total_incorrect,
                    'quiz' => $attempt->quiz ? [
                        'id' => $attempt->quiz->id,
                        'title' => $attempt->quiz->title,
                    ] : null,
                    'student' => $attempt->student ? [
                        'id' => $attempt->student->id,
                        'name' => $attempt->student->name,
                        'email' => $attempt->student->email,
                    ] : null,
                    'answers' => $answers,
                ],
            ]);
        }

        // Legacy JSON response
        return response()->json([
            'id' => $attempt->id,
            'quiz_id' => $attempt->quiz_id,
            'student_id' => $attempt->student_id,
            'started_at' => $attempt->started_at,
            'ended_at' => $attempt->ended_at,
            'score' => $attempt->score,
            'total_correct' => $attempt->total_correct,
            'total_incorrect' => $attempt->total_incorrect,
            'quiz' => ['id' => $attempt->quiz?->id, 'title' => $attempt->quiz?->title],
            'student' => ['id' => $attempt->student?->id, 'name' => $attempt->student?->name],
        ]);
    }

    public function edit($id)
    {
        $attempt = QuizAttempt::find($id);

        return response()->json($attempt);
    }

    public function update(Request $request, $id)
    {
        $attempt = QuizAttempt::find($id);
        $attempt->update([
            'quiz_id' => $request->quiz_id,
            'student_id' => $request->student_id,
            'started_at' => $request->started_at,
            'ended_at' => $request->ended_at,
            'score' => $request->score ?? 0,
            'total_correct' => $request->total_correct ?? 0,
            'total_incorrect' => $request->total_incorrect ?? 0,
        ]);

        return response()->json(['success' => 'Quiz Attempt updated successfully']);
    }

    public function destroy($id)
    {
        $attempt = QuizAttempt::find($id);

        if (!$attempt) {
            abort(404, 'Quiz Attempt not found');
        }

        $attempt->delete();

        // For Inertia requests
        if ($this->wantsInertiaResponse(request())) {
            return redirect()
                ->route('admin.attempts.index')
                ->with('success', 'Attempt deleted successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Quiz Attempt deleted successfully']);
    }
}
