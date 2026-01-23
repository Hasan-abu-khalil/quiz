<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Yajra\DataTables\DataTables;

class TagController extends Controller
{
    public function index(Request $request)
    {
        $query = Tag::query();

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where('tag_text', 'like', "%{$search}%");
        }

        $tags = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        // For Inertia response
        if ($request->inertia($request)) {
            return \Inertia\Inertia::render('admin/Tags/Index', [
                'tags' => $tags,
                'filters' => $request->only(['search']),
            ]);
        }

        // Check if this is an AJAX request (DataTables) - but NOT Inertia
        if ($this->isDataTablesRequest($request)) {
            $data = Tag::query();

            return DataTables::of($data)
                ->addIndexColumn()
                ->addColumn('action', function ($row) {
                    return '
                    <div class="d-grid gap-2 d-md-block">
                    <a href="javascript:void(0)" class="btn btn-info view" data-id="'.$row->id.'" data-toggle="tooltip" title="View">View</a>

                     <a href="javascript:void(0)" class="edit-Tag btn btn-primary btn-action" data-id="'.$row->id.'" data-toggle="tooltip" title="Edit">
                      <i class="fas fa-pencil-alt"></i>
                     </a>

                    <a href="javascript:void(0)" class="delete-Tag btn btn-danger" data-id="'.$row->id.'" data-toggle="tooltip" title="Delete">
                      <i class="fas fa-trash"></i>
                      </a>
                     </div>';
                })
                ->rawColumns(['action'])
                ->make(true);
        }

        // Fallback to Blade view for legacy routes
        return view('Dashboard/Tag/tag');
    }

    public function create(Request $request)
    {
        $request->validate([
            'tag_text' => 'required|string|max:255',
        ]);

        $tag = Tag::create([
            'tag_text' => $request->tag_text,
        ]);

        // Check for quick create - return JSON instead of redirect
        $quickCreate = $request->header('X-Quick-Create') === 'true'
            || $request->header('x-quick-create') === 'true';

        if ($quickCreate) {
            return response()->json([
                'success' => true,
                'tag' => [
                    'id' => $tag->id,
                    'tag_text' => $tag->tag_text,
                ],
            ]);
        }

        // For Inertia requests (only if NOT a quick create)
        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.tags.index')
                ->with('success', 'Tag created successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Tag saved successfully']);
    }

    public function show(string $id)
    {
        $tag = Tag::with('questions')->find($id);

        if (! $tag) {
            abort(404, 'Tag not found');
        }

        // For Inertia requests
        if (request()->inertia()) {
            return \Inertia\Inertia::render('admin/Tags/Show', [
                'tag' => [
                    'id' => $tag->id,
                    'tag_text' => $tag->tag_text,
                    'questions' => $tag->questions->map(function ($question) {
                        return [
                            'id' => $question->id,
                            'question_text' => $question->question_text,
                        ];
                    }),
                ],
            ]);
        }

        // Legacy JSON response
        return response()->json($tag);
    }

    public function edit($id)
    {
        $tag = Tag::find($id);

        return response()->json($tag);
    }

    public function update(Request $request, $id)
    {
        $tag = Tag::find($id);

        if (! $tag) {
            abort(404, 'Tag not found');
        }

        $request->validate([
            'tag_text' => 'required|string|max:255',
        ]);

        $tag->tag_text = $request->tag_text;
        $tag->save();

        // For Inertia requests
        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.tags.index')
                ->with('success', 'Tag updated successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Tag updated successfully']);
    }

    public function destroy($id)
    {
        $tag = Tag::find($id);

        if (! $tag) {
            abort(404, 'Tag not found');
        }

        $tag->delete();

        // For Inertia requests
        if (request()->inertia()) {
            return redirect()
                ->route('admin.tags.index')
                ->with('success', 'Tag deleted successfully');
        }

        // Legacy JSON response
        return response()->json(['success' => 'Tag deleted successfully']);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:tags,id',
        ]);

        $ids = $request->ids;
        $deleted = Tag::whereIn('id', $ids)->delete();

        if ($request->inertia($request)) {
            return redirect()
                ->route('admin.tags.index')
                ->with('success', "{$deleted} tag(s) deleted successfully");
        }

        return response()->json(['success' => "{$deleted} tag(s) deleted successfully"]);
    }
}
