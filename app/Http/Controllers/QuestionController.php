<?php

namespace App\Http\Controllers;

use App\Imports\QuestionsImport;
use App\Models\Question;
use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;
use Yajra\DataTables\DataTables;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->user();
        $query = Question::with(['subject', 'tags', 'options', 'assignedTo', 'creator']);

        // All users (teachers and admins) can see all questions
        // Edit/delete permissions are handled by middleware

        // Tab filter (state filter)
        $tab = $request->get('tab', 'all');
        if ($tab === 'review') {
            // Available for review - unassigned questions
            $query->where('state', Question::STATE_INITIAL);
        } elseif ($tab === 'my-review') {
            // My reviews - assigned to current user
            if ($user) {
                $query->where('assigned_to', $user->id)
                    ->where('state', Question::STATE_UNDER_REVIEW);
            } else {
                $query->whereRaw('1 = 0'); // No results if not authenticated
            }
        }
        // 'all' tab shows all questions regardless of state

        // Subject filter
        if ($request->has('subject_id') && ! empty($request->subject_id)) {
            $query->where('subject_id', $request->subject_id);
        }

        // Search
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question_text', 'like', "%{$search}%")
                    ->orWhereHas('subject', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }
        $questions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        // For Inertia requests, return Inertia response
        if ($this->wantsInertiaResponse($request)) {
            // Map questions to ensure relationships are properly serialized
            $questions->getCollection()->transform(function ($question) {
                return [
                    'id' => $question->id,
                    'subject_id' => $question->subject_id,
                    'question_text' => $question->question_text,
                    'state' => $question->state,
                    'assigned_to' => $question->assigned_to,
                    'assignedTo' => $question->assignedTo ? [
                        'id' => $question->assignedTo->id,
                        'name' => $question->assignedTo->name,
                    ] : null,
                    'creator' => $question->creator ? [
                        'id' => $question->creator->id,
                        'name' => $question->creator->name,
                    ] : null,
                    'subject' => $question->subject ? [
                        'id' => $question->subject->id,
                        'name' => $question->subject->name,
                    ] : null,
                    'tags' => $question->tags->map(function ($tag) {
                        return [
                            'id' => $tag->id,
                            'tag_text' => $tag->tag_text,
                        ];
                    }),
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                        ];
                    }),
                ];
            });

            return \Inertia\Inertia::render('admin/Questions/Index', [
                'questions' => $questions,
                'subjects' => Subject::select('id', 'name')->get(),
                'tags' => \App\Models\Tag::select('id', 'tag_text')->get(),
                'filters' => $request->only(['search', 'tab', 'subject_id']),
            ]);
        }

        // Check if this is an AJAX request (DataTables) - but NOT Inertia
        if ($this->isDataTablesRequest($request)) {
            $data = Question::with(['subject']);

            return DataTables::of($data)
                ->addIndexColumn()
                ->addColumn('subject_name', function ($row) {
                    return $row->subject ? $row->subject->name : '';
                })
                ->addColumn('question_text', function ($row) {
                    $text = $row->question_text;
                    $shortText = strlen($text) > 100 ? substr($text, 0, 100).'...' : $text;

                    return '<span class="short-text">'.$shortText.'</span>
                <span class="full-text" style="display:none;">'.$text.'</span>
                '.(strlen($text) > 100 ? '<a href="javascript:void(0)" class="toggle-text">Show More</a>' : '');
                })
                ->addColumn('action', function ($row) {
                    return '
                    <div class="d-grid gap-2 d-md-block">
                    <a href="javascript:void(0)" class="btn btn-info view" data-id="'.$row->id.'" data-toggle="tooltip" title="View">View</a>

                     <a href="javascript:void(0)" class="edit-question btn btn-primary btn-action" data-id="'.$row->id.'" data-toggle="tooltip" title="Edit">
                      <i class="fas fa-pencil-alt"></i>
                     </a>

                    <a href="javascript:void(0)" class="delete-question btn btn-danger" data-id="'.$row->id.'" data-toggle="tooltip" title="Delete">
                      <i class="fas fa-trash"></i>
                      </a>
                     </div>';
                })
                ->rawColumns(['action', 'question_text'])
                ->make(true);
        }

        // Fallback to Blade view for legacy routes
        $subjects = Subject::select('id', 'name')->get();

        return view('Dashboard/Question/question', compact('subjects'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,', // txt,xlsx
        ]);

        try {
            Excel::import(new QuestionsImport, $request->file('file'));

            return redirect()
                ->route('admin.questions.index')
                ->with('success', 'Questions imported successfully');

        } catch (ValidationException $e) {
            // Catch validation errors from the import
            return redirect()
                ->back()
                ->withErrors(['file' => 'The Excel file is invalid or contains errors.']);
        } catch (\Exception $e) {
            // Catch any other errors
            return redirect()
                ->back()
                ->withErrors(['file' => 'Failed to import the file: '.$e->getMessage()]);
        }
    }

    public function create(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'question_text' => 'required|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'options' => 'required|array|min:1',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        // Ensure at least one option is marked as correct
        $hasCorrectOption = collect($request->options)->contains('is_correct', true);
        if (! $hasCorrectOption) {
            return back()->withErrors([
                'options' => 'At least one option must be marked as correct.',
            ])->withInput();
        }

        $question = Question::create([
            'subject_id' => $request->subject_id,
            'question_text' => $request->question_text,
            'created_by' => Auth::id(),
        ]);

        // Create options
        foreach ($request->options as $optionData) {
            $question->options()->create([
                'option_text' => $optionData['option_text'],
                'is_correct' => $optionData['is_correct'] ?? false,
            ]);
        }

        // Sync tags if provided
        if ($request->has('tag_ids')) {
            $question->tags()->sync($request->tag_ids);
        }

        // For Inertia requests
        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.questions.index')
                ->with('success', 'Question created successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Question saved successfully']);
    }

    public function show(string $id)
    {
        $question = Question::with(['subject', 'tags', 'options', 'assignedTo', 'creator', 'stateHistory.changedBy'])->find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        // For Inertia requests
        if ($this->wantsInertiaResponse(request())) {
            return \Inertia\Inertia::render('admin/Questions/Show', [
                'question' => [
                    'id' => $question->id,
                    'subject_id' => $question->subject_id,
                    'question_text' => $question->question_text,
                    'state' => $question->state,
                    'assigned_to' => $question->assigned_to,
                    'assigned_to_user' => $question->assignedTo ? [
                        'id' => $question->assignedTo->id,
                        'name' => $question->assignedTo->name,
                    ] : null,
                    'subject' => $question->subject ? [
                        'id' => $question->subject->id,
                        'name' => $question->subject->name,
                    ] : null,
                    'tags' => $question->tags->map(function ($tag) {
                        return [
                            'id' => $tag->id,
                            'tag_text' => $tag->tag_text,
                        ];
                    }),
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                        ];
                    }),
                    'state_history' => $question->stateHistory->map(function ($history) {
                        return [
                            'id' => $history->id,
                            'from_state' => $history->from_state,
                            'to_state' => $history->to_state,
                            'changed_by' => $history->changedBy ? [
                                'id' => $history->changedBy->id,
                                'name' => $history->changedBy->name,
                            ] : null,
                            'notes' => $history->notes,
                            'created_at' => $history->created_at->toDateTimeString(),
                        ];
                    }),
                ],
            ]);
        }

        // Legacy JSON response
        return response()->json([
            'id' => $question->id,
            'subject_id' => $question->subject_id,
            'question_text' => $question->question_text,
            'subject' => [
                'id' => $question->subject?->id,
                'name' => $question->subject?->name,
            ],
        ]);
    }

    public function edit($id)
    {
        $question = Question::with(['subject', 'tags', 'options'])->find($id);
        if (! $question) {
            abort(404, 'Question not found');
        }

        if ($this->wantsInertiaResponse(request())) {
            return \Inertia\Inertia::render('admin/Questions/Edit', [
                'question' => $question,
                'subjects' => Subject::select('id', 'name')->get(),
                'tags' => Tag::select('id', 'tag_text')->get(),
            ]);
        }

        return response()->json($question);
    }

    public function update(Request $request, $id)
    {
        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'question_text' => 'required|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'options' => 'required|array|min:1',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        // Ensure at least one option is marked as correct
        $hasCorrectOption = collect($request->options)->contains('is_correct', true);
        if (! $hasCorrectOption) {
            return back()->withErrors([
                'options' => 'At least one option must be marked as correct.',
            ])->withInput();
        }

        $question->subject_id = $request->subject_id;
        $question->question_text = $request->question_text;
        $question->save();

        // Delete existing options and create new ones
        $question->options()->delete();
        foreach ($request->options as $optionData) {
            $question->options()->create([
                'option_text' => $optionData['option_text'],
                'is_correct' => $optionData['is_correct'] ?? false,
            ]);
        }

        // Sync tags if provided
        if ($request->has('tag_ids')) {
            $question->tags()->sync($request->tag_ids);
        } else {
            // If tag_ids is not provided, clear all tags
            $question->tags()->sync([]);
        }

        // For Inertia requests
        if ($this->wantsInertiaResponse($request)) {
            // Preserve current filters (tab, search, subject_id) when redirecting
            $queryParams = [];
            if ($request->has('tab')) {
                $queryParams['tab'] = $request->get('tab');
            }
            if ($request->has('search')) {
                $queryParams['search'] = $request->get('search');
            }
            if ($request->has('subject_id')) {
                $queryParams['subject_id'] = $request->get('subject_id');
            }

            return redirect()
                ->route('admin.questions.index', $queryParams)
                ->with('success', 'Question updated successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Question updated successfully']);
    }

    public function destroy($id)
    {
        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        $question->delete();

        // For Inertia requests
        if (request()->header('X-Inertia')) {
            return redirect()
                ->route('admin.questions.index')
                ->with('success', 'Question deleted successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Question deleted successfully']);
    }

    /**
     * Get questions for review (initial state - unassigned)
     */
    public function reviewIndex(Request $request)
    {
        $user = $this->user();
        $query = Question::with(['subject', 'tags', 'options', 'creator'])
            ->where('state', Question::STATE_INITIAL);

        // Search
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where('question_text', 'like', "%{$search}%")
                ->orWhereHas('subject', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
        }

        $questions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        if ($this->wantsInertiaResponse($request)) {
            return response()->json([
                'questions' => $questions,
            ]);
        }

        return response()->json($questions);
    }

    /**
     * Get questions assigned to current user for review
     */
    public function myReviewIndex(Request $request)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $query = Question::with(['subject', 'tags', 'options', 'creator'])
            ->where('assigned_to', $user->id)
            ->where('state', Question::STATE_UNDER_REVIEW);

        // Search
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where('question_text', 'like', "%{$search}%")
                ->orWhereHas('subject', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
        }

        $questions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        if ($this->wantsInertiaResponse($request)) {
            return response()->json([
                'questions' => $questions,
            ]);
        }

        return response()->json($questions);
    }

    /**
     * Assign question to current user (self-assignment)
     */
    public function assign(Request $request, $id)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        // Only teachers can assign questions
        if (! $user->hasRole('teacher') && ! $user->hasRole('admin')) {
            abort(403, 'Only teachers can assign questions for review');
        }

        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        if (! $question->canBeAssigned()) {
            return back()->withErrors([
                'message' => 'This question is already assigned or cannot be assigned.',
            ]);
        }

        if ($question->assignTo($user->id)) {
            if ($this->wantsInertiaResponse($request)) {
                return redirect()
                    ->route('admin.questions.index')
                    ->with('success', 'Question assigned successfully');
            }

            return response()->json(['success' => 'Question assigned successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to assign question.',
        ]);
    }

    /**
     * Change question state (under-review -> done)
     */
    public function changeState(Request $request, $id)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $request->validate([
            'state' => 'required|in:'.Question::STATE_UNDER_REVIEW.','.Question::STATE_DONE,
            'notes' => 'nullable|string|max:1000',
        ]);

        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        // Check if user is assigned to this question or is admin
        if (! $user->hasRole('admin')) {
            if ($question->assigned_to !== $user->id) {
                abort(403, 'You can only change state of questions assigned to you');
            }
        }

        // Validate state transition
        if ($request->state === Question::STATE_DONE && $question->state !== Question::STATE_UNDER_REVIEW) {
            return back()->withErrors([
                'message' => 'Question must be in under-review state to mark as done.',
            ]);
        }

        if ($question->changeState($request->state, $request->notes ?? null)) {
            if ($this->wantsInertiaResponse($request)) {
                return redirect()
                    ->route('admin.questions.index')
                    ->with('success', 'Question state updated successfully');
            }

            return response()->json(['success' => 'Question state updated successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to update question state.',
        ]);
    }
}
