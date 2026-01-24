<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TagSubjectController extends Controller
{
    /**
     * Display the tag-subject pivot relationships
     */
    public function index(Request $request)
    {
        $query = DB::table('subject_tag')
            ->join('subjects', 'subject_tag.subject_id', '=', 'subjects.id')
            ->join('tags', 'subject_tag.tag_id', '=', 'tags.id')
            ->select(
                'subject_tag.id as pivot_id',
                'subjects.id as subject_id',
                'subjects.name as subject_name',
                'tags.id as tag_id',
                'tags.tag_text as tag_text',
                'subject_tag.created_at',
                'subject_tag.updated_at'
            );

        // Filter by subject
        if ($request->has('subject_id') && ! empty($request->subject_id)) {
            $query->where('subjects.id', $request->subject_id);
        }

        // Filter by tag
        if ($request->has('tag_id') && ! empty($request->tag_id)) {
            $query->where('tags.id', $request->tag_id);
        }

        // Search
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subjects.name', 'like', "%{$search}%")
                    ->orWhere('tags.tag_text', 'like', "%{$search}%");
            });
        }

        $relationships = $query
            ->orderBy('subjects.name')
            ->orderBy('tags.tag_text')
            ->paginate(20)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total_relationships' => DB::table('subject_tag')->count(),
            'total_subjects' => Subject::count(),
            'total_tags' => Tag::count(),
            'subjects_with_tags' => Subject::whereHas('tags')->count(),
            'tags_with_subjects' => Tag::whereHas('subjects')->count(),
            'orphaned_subjects' => Subject::whereDoesntHave('tags')->count(),
            'orphaned_tags' => Tag::whereDoesntHave('subjects')->count(),
        ];

        // Top subjects by tag count
        $topSubjects = DB::table('subject_tag')
            ->join('subjects', 'subject_tag.subject_id', '=', 'subjects.id')
            ->select('subjects.id', 'subjects.name', DB::raw('COUNT(*) as tag_count'))
            ->groupBy('subjects.id', 'subjects.name')
            ->orderByDesc('tag_count')
            ->limit(10)
            ->get();

        // Top tags by subject count
        $topTags = DB::table('subject_tag')
            ->join('tags', 'subject_tag.tag_id', '=', 'tags.id')
            ->select('tags.id', 'tags.tag_text', DB::raw('COUNT(*) as subject_count'))
            ->groupBy('tags.id', 'tags.tag_text')
            ->orderByDesc('subject_count')
            ->limit(10)
            ->get();

        // Get orphaned items
        $orphanedSubjects = Subject::whereDoesntHave('tags')
            ->select('id', 'name', 'created_at')
            ->orderBy('name')
            ->get();

        $orphanedTags = Tag::whereDoesntHave('subjects')
            ->select('id', 'tag_text', 'created_at')
            ->orderBy('tag_text')
            ->get();

        if ($request->inertia($request)) {
            return Inertia::render('admin/TagSubjects/Index', [
                'relationships' => $relationships,
                'subjects' => Subject::select('id', 'name')->orderBy('name')->get(),
                'tags' => Tag::select('id', 'tag_text')->orderBy('tag_text')->get(),
                'stats' => $stats,
                'topSubjects' => $topSubjects,
                'topTags' => $topTags,
                'orphanedSubjects' => $orphanedSubjects,
                'orphanedTags' => $orphanedTags,
                'filters' => $request->only(['search', 'subject_id', 'tag_id']),
            ]);
        }
    }
}
