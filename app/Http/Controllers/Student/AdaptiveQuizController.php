<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AdaptiveQuizAssignment;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdaptiveQuizController extends Controller
{
    /**
     * Show the create adaptive quiz form
     */
    public function create()
    {
        $subjects = Subject::orderBy('name')->get(['id', 'name']);
        $tags = Tag::select('id', 'tag_text')->orderBy('tag_text')->get();

        return Inertia::render('student/Adaptive/Create', [
            'subjects' => $subjects,
            'tags' => $tags,
        ]);
    }

    /**
     * Generate adaptive quiz for the authenticated user (student, admin, or teacher)
     * Admin/teacher will generate quizzes for themselves
     */
    public function generate(Request $request)
    {
        $user = $this->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        $request->validate([
            'total_questions' => 'required|integer|min:1',
            'strategy' => 'required|in:worst_performing,never_attempted,recently_incorrect,weak_subjects,mixed',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'title' => 'nullable|string|max:255',
            'time_limit_minutes' => 'nullable|integer|min:1',
            'is_public' => 'nullable|boolean',
        ]);

        // Always use the authenticated user's ID as the target student
        $studentId = $user->id;
        $total = $request->get('total_questions');
        $strategy = $request->get('strategy');
        $subjectIds = $request->get('subject_ids', []);
        // Normalize subject IDs to integers
        $subjectIds = array_map('intval', array_filter($subjectIds, function ($id) {
            return ! empty($id);
        }));
        $title = $request->get('title');
        $timeLimit = $request->get('time_limit_minutes');
        $isPublic = $request->boolean('is_public', false);

        $query = Question::where('state', Question::STATE_DONE)
            ->with('subject:id,name');

        if (! empty($subjectIds)) {
            $query->whereIn('subject_id', $subjectIds);
        }

        // Filter by tag IDs if provided
        $tagIds = $request->get('tag_ids', []);
        if (! is_array($tagIds)) {
            $tagIds = $tagIds ? [$tagIds] : [];
        }
        $tagIds = array_filter(array_map('intval', $tagIds));

        if (! empty($tagIds)) {
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('tags.id', $tagIds);
            });
        }

        $questions = collect();

        switch ($strategy) {
            case 'worst_performing':
                $allQuestions = $query->get();
                $questions = $allQuestions->map(function ($question) {
                    $stats = $question->getPerformanceStats();

                    return [
                        'question' => $question,
                        'accuracy' => $stats ? $stats['accuracy_rate'] : null,
                    ];
                })
                    ->filter(function ($item) {
                        return $item['accuracy'] !== null;
                    })
                    ->sortBy('accuracy')
                    ->take($total * 2)
                    ->pluck('question');
                break;

            case 'never_attempted':
                $allQuestions = $query->get();
                $questions = $allQuestions->filter(function ($question) use ($studentId) {
                    return ! $question->hasBeenAttemptedBy($studentId);
                })->shuffle();
                break;

            case 'recently_incorrect':
                $allQuestions = $query->get();
                $questions = $allQuestions->filter(function ($question) use ($studentId) {
                    return $question->hasBeenIncorrectBy($studentId);
                })->shuffle();
                break;

            case 'weak_subjects':
                $allQuestions = $query->get();
                $subjectPerformance = [];

                foreach ($allQuestions->groupBy('subject_id') as $subjectId => $subjectQuestions) {
                    $totalAttempts = 0;
                    $totalCorrect = 0;

                    foreach ($subjectQuestions as $question) {
                        $stats = $question->getStudentPerformance($studentId);
                        if ($stats) {
                            $totalAttempts += $stats['total_attempts'];
                            $totalCorrect += $stats['correct_count'];
                        }
                    }

                    if ($totalAttempts > 0) {
                        $subjectPerformance[$subjectId] = ($totalCorrect / $totalAttempts) * 100;
                    } else {
                        $subjectPerformance[$subjectId] = 100;
                    }
                }

                asort($subjectPerformance);
                $worstSubjects = array_keys(array_slice($subjectPerformance, 0, min(3, count($subjectPerformance))));

                $questions = $allQuestions->filter(function ($question) use ($worstSubjects) {
                    return in_array($question->subject_id, $worstSubjects);
                })->shuffle();
                break;

            case 'mixed':
            default:
                // Random selection of questions
                $allQuestions = $query->get();
                $questions = $allQuestions->shuffle();
                break;
        }

        // Balance across subjects if subject_ids provided
        if (! empty($subjectIds) && $questions->count() > $total) {
            $questionsBySubject = $questions->groupBy('subject_id');
            $questionsPerSubject = (int) floor($total / count($subjectIds));
            $remainder = $total % count($subjectIds);

            $selected = collect();
            $index = 0;
            foreach ($subjectIds as $subjectId) {
                $subjectId = (int) $subjectId; // Ensure integer for groupBy key matching
                $count = $questionsPerSubject + ($index < $remainder ? 1 : 0);
                // groupBy creates integer keys, so we need to match with integer
                $subjectQuestions = $questionsBySubject->get($subjectId, collect())->shuffle();
                $selected = $selected->merge($subjectQuestions->take($count));
                $index++;
            }

            if ($selected->count() < $total) {
                $remaining = $questions->filter(function ($q) use ($selected) {
                    return ! $selected->contains('id', $q->id);
                })->shuffle();
                $selected = $selected->merge($remaining->take($total - $selected->count()));
            }

            $questions = $selected->shuffle()->take($total);
        } else {
            $questions = $questions->shuffle()->take($total);
        }

        // Create quiz record
        $strategyNames = [
            'mixed' => 'Random Questions',
            'never_attempted' => 'Never Attempted',
            'worst_performing' => 'Worst Performing',
            'recently_incorrect' => 'Review Incorrect',
            'weak_subjects' => 'Weak Subjects',
        ];

        $targetStudent = \App\Models\User::find($studentId);
        $quizTitle = $title ?: sprintf(
            'Challenge: %s - %s',
            $strategyNames[$strategy] ?? 'Adaptive',
            $targetStudent ? $targetStudent->name : 'Student'
        );

        $quiz = Quiz::create([
            'title' => $quizTitle,
            'mode' => 'adaptive',
            'subject_id' => ! empty($subjectIds) && count($subjectIds) === 1 ? $subjectIds[0] : null,
            'total_questions' => $questions->count(),
            'time_limit_minutes' => $timeLimit,
            'created_by' => $user ? $user->id : null,
        ]);

        AdaptiveQuizAssignment::create([
            'quiz_id' => $quiz->id,
            'target_student_id' => $studentId,
            'strategy' => $strategy,
            'subject_ids' => ! empty($subjectIds) ? $subjectIds : null,
            'is_public' => $isPublic,
        ]);

        $questions->each(function ($question, $index) use ($quiz) {
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question_id' => $question->id,
                'order' => $index + 1,
            ]);
        });

        // Return JSON for admin/teacher API calls, redirect for student UI
        $isAdminOrTeacher = $user->hasRole('admin') || $user->hasRole('teacher');
        if ($isAdminOrTeacher && $request->wantsJson()) {
            $quiz->load('questions.subject');

            return response()->json([
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'mode' => $quiz->mode,
                    'total_questions' => $quiz->total_questions,
                    'time_limit_minutes' => $quiz->time_limit_minutes,
                ],
                'questions' => $questions->values()->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'subject_id' => $question->subject_id,
                        'subject' => $question->subject ? [
                            'id' => $question->subject->id,
                            'name' => $question->subject->name,
                        ] : null,
                    ];
                })->toArray(),
            ]);
        }

        return redirect()->route('student.quizzes.show', $quiz->id)
            ->with('success', 'Adaptive quiz generated successfully!');
    }

    /**
     * Browse available adaptive quizzes from other students
     */
    public function index(Request $request)
    {
        $currentStudentId = Auth::id();

        $query = Quiz::where('mode', 'adaptive')
            ->whereHas('adaptiveAssignment', function ($q) {
                $q->where('is_public', true);
            })
            ->with(['adaptiveAssignment.targetStudent:id,name', 'subject:id,name', 'attempts:id,quiz_id']);

        // Apply filters
        if ($request->has('strategy') && $request->strategy) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($request) {
                $q->where('strategy', $request->strategy);
            });
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('target_student_id') && $request->target_student_id) {
            $query->whereHas('adaptiveAssignment', function ($q) use ($request) {
                $q->where('target_student_id', $request->target_student_id);
            });
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('adaptiveAssignment.targetStudent', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $quizzes = $query->orderByDesc('created_at')->paginate(12);

        $quizzes->getCollection()->transform(function ($quiz) {
            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'total_questions' => $quiz->total_questions,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'created_at' => $quiz->created_at,
                'created_by' => $quiz->created_by,
                'subject' => $quiz->subject ? [
                    'id' => $quiz->subject->id,
                    'name' => $quiz->subject->name,
                ] : null,
                'target_student' => $quiz->adaptiveAssignment && $quiz->adaptiveAssignment->targetStudent ? [
                    'id' => $quiz->adaptiveAssignment->targetStudent->id,
                    'name' => $quiz->adaptiveAssignment->targetStudent->name,
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
        $targetStudents = \App\Models\User::whereHas('adaptiveQuizzes', function ($q) use ($currentStudentId) {
            $q->where('target_student_id', '!=', $currentStudentId);
        })->orderBy('name')->get(['id', 'name'])->unique('id')->values();

        return Inertia::render('student/Adaptive/Browse', [
            'quizzes' => $quizzes,
            'strategies' => $strategies,
            'subjects' => $subjects,
            'targetStudents' => $targetStudents,
            'filters' => $request->only(['strategy', 'subject_id', 'target_student_id', 'search']),
        ]);
    }

    /**
     * Show leaderboard for a specific adaptive quiz
     */
    public function leaderboard(Quiz $quiz)
    {
        if ($quiz->mode !== 'adaptive') {
            abort(404);
        }

        $attempts = $quiz->attempts()
            ->with('student:id,name')
            ->orderByDesc('score')
            ->orderBy('ended_at')
            ->get();

        $leaderboard = $attempts->map(function ($attempt, $index) use ($quiz) {
            return [
                'rank' => $index + 1,
                'student_id' => $attempt->student_id,
                'student_name' => $attempt->student->name,
                'score' => $attempt->score,
                'total_questions' => $quiz->total_questions,
                'percentage' => $quiz->total_questions > 0
                    ? round(($attempt->score / $quiz->total_questions) * 100, 2)
                    : 0,
                'attempted_at' => $attempt->ended_at ?? $attempt->started_at,
            ];
        });

        $quiz->load('adaptiveAssignment.targetStudent:id,name', 'subject:id,name');

        return Inertia::render('student/Adaptive/Leaderboard', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'total_questions' => $quiz->total_questions,
                'target_student' => $quiz->adaptiveAssignment && $quiz->adaptiveAssignment->targetStudent ? [
                    'id' => $quiz->adaptiveAssignment->targetStudent->id,
                    'name' => $quiz->adaptiveAssignment->targetStudent->name,
                ] : null,
                'strategy' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->strategy : null,
                'subject' => $quiz->subject ? [
                    'id' => $quiz->subject->id,
                    'name' => $quiz->subject->name,
                ] : null,
            ],
            'leaderboard' => $leaderboard,
            'currentStudentId' => Auth::id(),
        ]);
    }

    /**
     * List adaptive quizzes created by current student
     */
    public function myChallenges(Request $request)
    {
        $currentStudentId = Auth::id();

        $query = Quiz::where('mode', 'adaptive')
            ->whereHas('adaptiveAssignment', function ($q) use ($currentStudentId) {
                $q->where('target_student_id', $currentStudentId);
            })
            ->with(['adaptiveAssignment', 'subject:id,name', 'attempts']);

        $quizzes = $query->orderByDesc('created_at')->paginate(12);

        $quizzes->getCollection()->transform(function ($quiz) {
            $bestAttempt = $quiz->attempts->sortByDesc('score')->first();

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
                'strategy' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->strategy : null,
                'subject_ids' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->subject_ids : null,
                'attempt_count' => $quiz->attempts->count(),
                'best_score' => $bestAttempt ? $bestAttempt->score : null,
                'is_public' => $quiz->adaptiveAssignment ? $quiz->adaptiveAssignment->is_public : false,
            ];
        });

        $strategies = [
            'worst_performing' => 'Worst Performing',
            'never_attempted' => 'Never Attempted',
            'recently_incorrect' => 'Review Incorrect',
            'weak_subjects' => 'Weak Subjects',
            'mixed' => 'Random Questions',
        ];

        return Inertia::render('student/Adaptive/MyChallenges', [
            'quizzes' => $quizzes,
            'strategies' => $strategies,
        ]);
    }

    /**
     * Toggle quiz visibility (public/private)
     */
    public function toggleVisibility(Request $request, Quiz $quiz)
    {
        $user = $this->user();

        // Verify the user owns this quiz
        if ($quiz->created_by !== $user->id) {
            abort(403, 'You can only modify quizzes you created.');
        }

        $assignment = $quiz->adaptiveAssignment;
        if (! $assignment) {
            abort(404, 'Adaptive quiz assignment not found.');
        }

        $assignment->update([
            'is_public' => ! $assignment->is_public,
        ]);

        if ($request->inertia($request)) {
            return redirect()
                ->back()
                ->with('success', $assignment->is_public
                    ? 'Quiz is now public and visible in Browse.'
                    : 'Quiz is now private and only visible to you.');
        }

        return response()->json([
            'success' => true,
            'is_public' => $assignment->is_public,
        ]);
    }
}
