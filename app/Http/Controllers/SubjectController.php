<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::query();

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $subjects = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('admin/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']), // pass the search term to the frontend
        ]);

        if ($request->ajax()) {

            $data = Subject::query();

            return DataTables::of($data)
                ->addIndexColumn()
                ->addColumn('action', function ($row) {
                    return '
                    <div class="d-grid gap-2 d-md-block">
                    <a href="javascript:void(0)" class="btn btn-info view" data-id="' . $row->id . '" data-toggle="tooltip" title="View">View</a>

                     <a href="javascript:void(0)" class="edit-subject btn btn-primary btn-action" data-id="' . $row->id . '" data-toggle="tooltip" title="Edit">
                      <i class="fas fa-pencil-alt"></i>
                     </a>

                    <a href="javascript:void(0)" class="delete-subject btn btn-danger" data-id="' . $row->id . '" data-toggle="tooltip" title="Delete">
                      <i class="fas fa-trash"></i>
                      </a>
                     </div>';
                })
                ->rawColumns(['action'])
                ->make(true);
        }

        return view('Dashboard/Subject/subject');
    }

    public function create(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:subjects,name',
        ]);
        $subject = Subject::create([
            'name' => $request->name,

        ]);

        if ($request->header('X-Inertia')) {
            return redirect()
                ->route('admin.subjects.index')
                ->with('success', 'Subject created successfully');
        }

        return response()->json(['success' => 'Subject saved successfully']);
    }

    public function show(string $id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json(['error' => 'Subject not found'], 404);
        }

        if (request()->header('X-Inertia')) {
            return Inertia::render('admin/Subjects/Show', [
                'subject' => $subject,
            ]);
        }

        return response()->json($subject);
    }

    public function edit($id)
    {
        $subject = Subject::find($id);
        if (request()->header('X-Inertia')) {
            return Inertia::render('admin/Subjects/Edit', [
                'subject' => $subject,
            ]);
        }

        return response()->json($subject);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|unique:subjects,name',
        ]);
        $subject = Subject::find($id);
        $subject->name = $request->name;

        $subject->save();
        if ($request->header('X-Inertia')) {
            return redirect()
                ->route('admin.subjects.index')
                ->with('success', 'Subject updated successfully');
        }

        return response()->json(['success' => 'Subject updated successfully']);
    }

    public function destroy($id)
    {
        Subject::find($id)->delete();
        if (request()->header('X-Inertia')) {
            return redirect()
                ->route('admin.subjects.index')
                ->with('success', 'Subject deleted successfully');
        }

        return response()->json(['success' => 'Subject deleted successfully']);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:subjects,id',
        ]);

        $ids = $request->ids;
        $deleted = Subject::whereIn('id', $ids)->delete();

        if ($this->wantsInertiaResponse($request)) {
            return redirect()
                ->route('admin.subjects.index')
                ->with('success', "{$deleted} subject(s) deleted successfully");
        }

        return response()->json(['success' => "{$deleted} subject(s) deleted successfully"]);
    }
}
