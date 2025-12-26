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
        $query = Question::with(['subject', 'tags', 'options', 'assignedTo', 'creator.roles']);

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
                        'roles' => $question->creator->roles->map(function ($role) {
                            return [
                                'id' => $role->id,
                                'name' => $role->name,
                            ];
                        }),
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
     * Show the form for creating a new question.
     */
    public function createForm(Request $request)
    {
        if ($this->wantsInertiaResponse($request)) {
            return \Inertia\Inertia::render('admin/Questions/Create', [
                'subjects' => Subject::select('id', 'name')->get(),
                'tags' => \App\Models\Tag::select('id', 'tag_text')->get(),
            ]);
        }

        // Legacy fallback
        $subjects = Subject::select('id', 'name')->get();

        return view('Dashboard/Question/question', compact('subjects'));
    }

    /**
     * Import questions from Excel file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx',
        ]);

        try {
            $file = $request->file('file');
            $filePath = $file->getRealPath();
            Excel::import(new QuestionsImport($filePath), $file);

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
            'explanations' => 'nullable|array',
            'explanations.correct' => 'nullable|string',
            'explanations.wrong' => 'nullable|string',
            'explanations.option1' => 'nullable|string',
            'explanations.option2' => 'nullable|string',
            'explanations.option3' => 'nullable|string',
            'explanations.option4' => 'nullable|string',
            'explanations.option5' => 'nullable|string',
        ]);

        // Ensure at least one option is marked as correct
        $hasCorrectOption = collect($request->options)->contains('is_correct', true);
        if (! $hasCorrectOption) {
            return back()->withErrors([
                'options' => 'At least one option must be marked as correct.',
            ])->withInput();
        }

        // Prepare explanations - remove empty values
        $explanations = [];
        if ($request->has('explanations')) {
            $rawExplanations = $request->explanations;
            if (! empty($rawExplanations['correct'])) {
                $explanations['correct'] = trim($rawExplanations['correct']);
            }
            if (! empty($rawExplanations['wrong'])) {
                $explanations['wrong'] = trim($rawExplanations['wrong']);
            }
            for ($i = 1; $i <= 5; $i++) {
                $key = "option{$i}";
                if (! empty($rawExplanations[$key])) {
                    $explanations[$key] = trim($rawExplanations[$key]);
                }
            }
        }

        $questionData = [
            'subject_id' => $request->subject_id,
            'question_text' => $request->question_text,
            'created_by' => Auth::id(),
        ];

        if (! empty($explanations)) {
            $questionData['explanations'] = $explanations;
        }

        $question = Question::create($questionData);

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
                    'explanations' => $question->explanations,
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
            'state' => $question->state,
            'assigned_to' => $question->assigned_to,
            'assigned_to_user' => $question->assignedTo ? [
                'id' => $question->assignedTo->id,
                'name' => $question->assignedTo->name,
            ] : null,
            'subject' => [
                'id' => $question->subject?->id,
                'name' => $question->subject?->name,
            ],
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
        ]);
    }

    public function edit($id)
    {
        $user = $this->user();
        $question = Question::with(['subject', 'tags', 'options'])->find($id);
        if (! $question) {
            abort(404, 'Question not found');
        }

        // Authorization: Can only edit if assigned to self and not done, or if admin
        if (! $user->hasRole('admin')) {
            $isAssignedToSelf = $question->assigned_to === $user->id;
            $isDone = $question->state === Question::STATE_DONE;

            if (! $isAssignedToSelf || $isDone) {
                abort(403, 'You can only edit questions assigned to you that are not in done state. Please assign the question to yourself first or reset it if it is done.');
            }
        }

        if ($this->wantsInertiaResponse(request())) {
            return \Inertia\Inertia::render('admin/Questions/Edit', [
                'question' => [
                    'id' => $question->id,
                    'subject_id' => $question->subject_id,
                    'question_text' => $question->question_text,
                    'state' => $question->state,
                    'assigned_to' => $question->assigned_to,
                    'explanations' => $question->explanations,
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
                ],
                'subjects' => Subject::select('id', 'name')->get(),
                'tags' => Tag::select('id', 'tag_text')->get(),
            ]);
        }

        return response()->json($question);
    }

    public function update(Request $request, $id)
    {
        $user = $this->user();
        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        // Authorization: Can only update if assigned to self and not done, or if admin
        if (! $user->hasRole('admin')) {
            $isAssignedToSelf = $question->assigned_to === $user->id;
            $isDone = $question->state === Question::STATE_DONE;

            if (! $isAssignedToSelf || $isDone) {
                return back()->withErrors([
                    'message' => 'You can only update questions assigned to you that are not in done state. Please assign the question to yourself first or reset it if it is done.',
                ])->withInput();
            }
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'question_text' => 'required|string',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'options' => 'required|array|min:1',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
            'explanations' => 'nullable|array',
            'explanations.correct' => 'nullable|string',
            'explanations.wrong' => 'nullable|string',
            'explanations.option1' => 'nullable|string',
            'explanations.option2' => 'nullable|string',
            'explanations.option3' => 'nullable|string',
            'explanations.option4' => 'nullable|string',
            'explanations.option5' => 'nullable|string',
            'approve' => 'nullable|boolean',
        ]);

        // Ensure at least one option is marked as correct
        $hasCorrectOption = collect($request->options)->contains('is_correct', true);
        if (! $hasCorrectOption) {
            return back()->withErrors([
                'options' => 'At least one option must be marked as correct.',
            ])->withInput();
        }

        // Prepare explanations - remove empty values
        $explanations = [];
        if ($request->has('explanations')) {
            $rawExplanations = $request->explanations;
            if (! empty($rawExplanations['correct'])) {
                $explanations['correct'] = trim($rawExplanations['correct']);
            }
            if (! empty($rawExplanations['wrong'])) {
                $explanations['wrong'] = trim($rawExplanations['wrong']);
            }
            for ($i = 1; $i <= 5; $i++) {
                $key = "option{$i}";
                if (! empty($rawExplanations[$key])) {
                    $explanations[$key] = trim($rawExplanations[$key]);
                }
            }
        }

        $question->subject_id = $request->subject_id;
        $question->question_text = $request->question_text;

        // Update explanations - set to null if empty, otherwise set the cleaned array
        if (empty($explanations)) {
            $question->explanations = null;
        } else {
            $question->explanations = $explanations;
        }

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
        }

        // Handle approval if requested
        if ($request->boolean('approve')) {
            $user = $this->user();
            if (! $user) {
                abort(401, 'Unauthenticated');
            }

            // Check if user can approve (must be assigned to question or be admin)
            $canApprove = $user->hasRole('admin') || $question->assigned_to === $user->id;

            if (! $canApprove) {
                return back()->withErrors([
                    'message' => 'You do not have permission to approve this question.',
                ])->withInput();
            }

            // Only approve if question is in under-review state
            if ($question->state === Question::STATE_UNDER_REVIEW) {
                $question->changeState(Question::STATE_DONE, 'Approved after review');
            }
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

            $message = $request->boolean('approve')
                ? 'Question updated and approved successfully'
                : 'Question updated successfully';

            return redirect()
                ->route('admin.questions.index', $queryParams)
                ->with('success', $message);
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
                ->route('admin.questions.index', request()->only(['tab', 'search', 'subject_id', 'page']))
                ->with('success', 'Question deleted successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Question deleted successfully']);
    }

    public function bulkDestroy(Request $request)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:questions,id',
        ]);

        $ids = $request->ids;

        // If user is not admin, filter to only allow deleting questions they created
        if (! $user->hasRole('admin')) {
            $questions = Question::whereIn('id', $ids)->get();
            $unauthorizedIds = $questions
                ->filter(function ($question) use ($user) {
                    return $question->created_by !== $user->id;
                })
                ->pluck('id')
                ->toArray();

            if (! empty($unauthorizedIds)) {
                return back()->withErrors([
                    'message' => 'You can only delete questions you created. Some selected questions were created by others.',
                ])->withInput();
            }
        }

        $deleted = Question::whereIn('id', $ids)->delete();

        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                ->with('success', "{$deleted} question(s) deleted successfully");
        }

        return response()->json(['success' => "{$deleted} question(s) deleted successfully"]);
    }

    /**
     * Get all question IDs matching the current filter (for select all)
     */
    public function getIds(Request $request)
    {
        $user = $this->user();
        $query = Question::query();

        // Tab filter (state filter)
        $tab = $request->get('tab', 'all');
        if ($tab === 'review') {
            $query->where('state', Question::STATE_INITIAL);
        } elseif ($tab === 'my-review') {
            if ($user) {
                $query->where('assigned_to', $user->id)
                    ->where('state', Question::STATE_UNDER_REVIEW);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

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

        $ids = $query->pluck('id')->toArray();

        return response()->json(['ids' => $ids]);
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

        // Only teachers and admins can assign questions
        if (! $user->hasRole('teacher') && ! $user->hasRole('admin')) {
            abort(403, 'Only teachers can assign questions for review');
        }

        $question = Question::with('creator.roles')->find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        // Authorization: Teachers can only assign questions created by admins or themselves
        if ($user->hasRole('teacher') && ! $user->hasRole('admin')) {
            $isOwnQuestion = $question->created_by === $user->id;
            $isAdminCreated = $question->creator && $question->creator->hasRole('admin');

            if (! $isOwnQuestion && ! $isAdminCreated) {
                return back()->withErrors([
                    'message' => 'You can only assign questions created by admins or your own questions.',
                ]);
            }
        }

        if (! $question->canBeAssigned()) {
            return back()->withErrors([
                'message' => 'This question is already assigned or cannot be assigned.',
            ]);
        }

        if ($question->assignTo($user->id)) {
            if ($this->wantsInertiaResponse($request)) {
                return redirect()
                    ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                    ->with('success', 'Question assigned successfully');
            }

            return response()->json(['success' => 'Question assigned successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to assign question.',
        ]);
    }

    /**
     * Bulk assign questions to current user
     */
    public function bulkAssign(Request $request)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        // Only teachers and admins can assign questions
        if (! $user->hasRole('teacher') && ! $user->hasRole('admin')) {
            abort(403, 'Only teachers can assign questions for review');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:questions,id',
        ]);

        $ids = $request->ids;
        $questions = Question::with('creator.roles')->whereIn('id', $ids)->get();

        $assigned = 0;
        $skipped = 0;
        $unauthorized = [];

        foreach ($questions as $question) {
            // Authorization: Teachers can only assign questions created by admins or themselves
            if ($user->hasRole('teacher') && ! $user->hasRole('admin')) {
                $isOwnQuestion = $question->created_by === $user->id;
                $isAdminCreated = $question->creator && $question->creator->hasRole('admin');

                if (! $isOwnQuestion && ! $isAdminCreated) {
                    $unauthorized[] = $question->id;

                    continue;
                }
            }

            // Check if question can be assigned
            if ($question->canBeAssigned()) {
                if ($question->assignTo($user->id)) {
                    $assigned++;
                } else {
                    $skipped++;
                }
            } else {
                $skipped++;
            }
        }

        if (! empty($unauthorized)) {
            return back()->withErrors([
                'message' => 'You can only assign questions created by admins or your own questions. Some selected questions were created by others.',
            ])->withInput();
        }

        $message = "{$assigned} question(s) assigned successfully";
        if ($skipped > 0) {
            $message .= ". {$skipped} question(s) were skipped (already assigned or cannot be assigned).";
        }

        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                ->with('success', $message);
        }

        return response()->json(['success' => $message]);
    }

    /**
     * Bulk change question state (mark as done)
     */
    public function bulkChangeState(Request $request)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:questions,id',
            'state' => 'required|in:'.Question::STATE_UNDER_REVIEW.','.Question::STATE_DONE,
        ]);

        $ids = $request->ids;
        $newState = $request->state;
        $questions = Question::whereIn('id', $ids)->get();

        $changed = 0;
        $skipped = 0;
        $unauthorized = [];

        foreach ($questions as $question) {
            // Check if user can change state of this question
            if (! $user->hasRole('admin')) {
                if ($question->assigned_to !== $user->id) {
                    $unauthorized[] = $question->id;

                    continue;
                }
            }

            // Validate state transition (only allow marking as done if in under-review)
            if ($newState === Question::STATE_DONE && $question->state !== Question::STATE_UNDER_REVIEW) {
                $skipped++;

                continue;
            }

            if ($question->changeState($newState, 'Bulk state change')) {
                $changed++;
            } else {
                $skipped++;
            }
        }

        if (! empty($unauthorized)) {
            return back()->withErrors([
                'message' => 'You can only change state of questions assigned to you. Some selected questions are not assigned to you.',
            ])->withInput();
        }

        $message = "{$changed} question(s) marked as done successfully";
        if ($skipped > 0) {
            $message .= ". {$skipped} question(s) were skipped (not in under-review state or cannot be changed).";
        }

        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                ->with('success', $message);
        }

        return response()->json(['success' => $message]);
    }

    /**
     * Unassign question (self or admin)
     */
    public function unassign(Request $request, $id)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $question = Question::find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        $isAdmin = $user->hasRole('admin');

        if (! $question->canBeUnassigned($user->id, $isAdmin)) {
            return back()->withErrors([
                'message' => 'You cannot unassign this question.',
            ]);
        }

        if ($question->unassign($user->id)) {
            if ($this->wantsInertiaResponse($request)) {
                return redirect()
                    ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                    ->with('success', 'Question unassigned successfully');
            }

            return response()->json(['success' => 'Question unassigned successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to unassign question.',
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
                    ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                    ->with('success', 'Question state updated successfully');
            }

            return response()->json(['success' => 'Question state updated successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to update question state.',
        ]);
    }

    /**
     * Reset done question back to initial state (for editing)
     * Auto-assigns to current user if not already assigned
     */
    public function resetToInitial(Request $request, $id)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $question = Question::with('creator.roles')->find($id);

        if (! $question) {
            abort(404, 'Question not found');
        }

        // Authorization: Only allow reset if:
        // - User is admin, OR
        // - Question is assigned to user, OR
        // - Question is not assigned and user can assign it (admin-created or own question)
        if (! $user->hasRole('admin')) {
            $isAssignedToSelf = $question->assigned_to === $user->id;
            $isUnassigned = ! $question->assigned_to;

            if ($isUnassigned) {
                // Check if user can assign this question
                $isOwnQuestion = $question->created_by === $user->id;
                $isAdminCreated = $question->creator && $question->creator->hasRole('admin');

                if (! $isOwnQuestion && ! $isAdminCreated) {
                    abort(403, 'You can only reset questions created by admins or your own questions.');
                }
            } elseif (! $isAssignedToSelf) {
                abort(403, 'You can only reset questions assigned to you');
            }
        }

        // Reset and auto-assign if not already assigned (always assign to enable editing)
        $assignToUserId = ! $question->assigned_to ? $user->id : null;

        if ($question->resetToInitial($user->id, $assignToUserId)) {
            if ($this->wantsInertiaResponse($request)) {
                $message = $assignToUserId
                    ? 'Question reset to initial state and assigned to you successfully'
                    : 'Question reset to initial state successfully';

                return redirect()
                    ->route('admin.questions.index', $request->only(['tab', 'search', 'subject_id', 'page']))
                    ->with('success', $message);
            }

            return response()->json(['success' => 'Question reset to initial state successfully']);
        }

        return back()->withErrors([
            'message' => 'Failed to reset question. Question must be in done state.',
        ]);
    }

    /**
     * Get questions by multiple subject IDs (for quiz creation)
     * If total_questions is provided, returns balanced selection across subjects
     */
    public function bySubjects(Request $request)
    {
        $subjectIds = $request->get('subject_ids', []);
        $totalQuestions = $request->get('total_questions');

        // Handle array parameter - Laravel can receive it as array or string
        if (! is_array($subjectIds)) {
            // If it's a string, try to parse it
            if (is_string($subjectIds)) {
                $subjectIds = [$subjectIds];
            } else {
                $subjectIds = [];
            }
        }

        // Filter out empty values
        $subjectIds = array_filter($subjectIds, function ($id) {
            return ! empty($id);
        });

        $query = Question::where('state', Question::STATE_DONE)
            ->with('subject:id,name');

        if (! empty($subjectIds)) {
            $query->whereIn('subject_id', $subjectIds);
        }

        $allQuestions = $query->select('id', 'question_text', 'subject_id')->get();

        // If total_questions is provided, return balanced selection
        if ($totalQuestions && is_numeric($totalQuestions) && $totalQuestions > 0) {
            $total = (int) $totalQuestions;

            // Determine which subjects to use
            $subjectsToUse = ! empty($subjectIds)
                ? $subjectIds
                : $allQuestions->pluck('subject_id')->filter()->unique()->values()->toArray();

            if (empty($subjectsToUse)) {
                return response()->json([]);
            }

            // Group questions by subject
            $questionsBySubject = [];
            foreach ($subjectsToUse as $subjectId) {
                $questionsBySubject[$subjectId] = $allQuestions->filter(function ($q) use ($subjectId) {
                    return $q->subject_id == $subjectId;
                })->values();
            }

            // Calculate questions per subject (balanced distribution)
            $questionsPerSubject = (int) floor($total / count($subjectsToUse));
            $remainder = $total % count($subjectsToUse);

            $selected = collect();

            // Distribute questions evenly across subjects
            foreach ($subjectsToUse as $index => $subjectId) {
                $available = $questionsBySubject[$subjectId] ?? collect();
                if ($available->isEmpty()) {
                    continue;
                }

                // Add one extra question to first 'remainder' subjects
                $count = $questionsPerSubject + ($index < $remainder ? 1 : 0);
                $actualCount = min($count, $available->count());

                // Shuffle and select from this subject
                $selectedFromSubject = $available->shuffle()->take($actualCount);
                $selected = $selected->merge($selectedFromSubject);
            }

            // If we still need more questions (some subjects had fewer than allocated)
            if ($selected->count() < $total) {
                $remaining = $allQuestions->filter(function ($q) use ($selected) {
                    return ! $selected->contains('id', $q->id);
                })->shuffle()->take($total - $selected->count());
                $selected = $selected->merge($remaining);
            }

            // Shuffle final selection and limit to total
            $finalSelected = $selected->shuffle()->take($total);

            return response()->json($finalSelected->values()->toArray());
        }

        // Return all questions if no total_questions specified
        return response()->json($allQuestions->values()->toArray());
    }
}
