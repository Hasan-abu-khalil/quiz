<?php

namespace App\Console\Commands;

use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExploreTagSubjectPivot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pivot:explore 
                            {--tag= : Filter by tag ID}
                            {--subject= : Filter by subject ID}
                            {--all : Show all relationships}
                            {--stats : Show statistics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Explore the Tag-Subject pivot table relationships';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tagId = $this->option('tag');
        $subjectId = $this->option('subject');
        $showAll = $this->option('all');
        $showStats = $this->option('stats');

        if ($showStats) {
            $this->showStatistics();

            return Command::SUCCESS;
        }

        if ($showAll || (! $tagId && ! $subjectId)) {
            $this->showAllRelationships();

            return Command::SUCCESS;
        }

        if ($tagId) {
            $this->showTagRelationships($tagId);
        }

        if ($subjectId) {
            $this->showSubjectRelationships($subjectId);
        }

        return Command::SUCCESS;
    }

    /**
     * Show all relationships in the pivot table
     */
    protected function showAllRelationships()
    {
        $this->info('=== All Tag-Subject Relationships ===');
        $this->newLine();

        // Method 1: Direct pivot table query
        $pivotData = DB::table('subject_tag')
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
            )
            ->orderBy('subjects.name')
            ->orderBy('tags.tag_text')
            ->get();

        if ($pivotData->isEmpty()) {
            $this->warn('No relationships found in the pivot table.');

            return;
        }

        $this->table(
            ['Pivot ID', 'Subject', 'Tag', 'Created At', 'Updated At'],
            $pivotData->map(function ($row) {
                return [
                    $row->pivot_id,
                    "{$row->subject_name} (ID: {$row->subject_id})",
                    "{$row->tag_text} (ID: {$row->tag_id})",
                    $row->created_at,
                    $row->updated_at,
                ];
            })->toArray()
        );

        $this->newLine();
        $this->info("Total relationships: {$pivotData->count()}");
    }

    /**
     * Show relationships for a specific tag
     */
    protected function showTagRelationships($tagId)
    {
        $tag = Tag::find($tagId);

        if (! $tag) {
            $this->error("Tag with ID {$tagId} not found.");

            return;
        }

        $this->info("=== Subjects associated with Tag: {$tag->tag_text} (ID: {$tag->id}) ===");
        $this->newLine();

        // Method 1: Using Eloquent relationship
        $subjects = $tag->subjects;

        if ($subjects->isEmpty()) {
            $this->warn('No subjects associated with this tag.');

            return;
        }

        $this->table(
            ['Subject ID', 'Subject Name', 'Pivot Created At'],
            $subjects->map(function ($subject) {
                return [
                    $subject->id,
                    $subject->name,
                    $subject->pivot->created_at ?? 'N/A',
                ];
            })->toArray()
        );

        $this->newLine();
        $this->info("Total subjects: {$subjects->count()}");

        // Method 2: Access pivot attributes directly
        $this->newLine();
        $this->info('=== Pivot Table Details ===');
        foreach ($subjects as $subject) {
            $this->line("Tag '{$tag->tag_text}' <-> Subject '{$subject->name}'");
            $this->line("  Pivot ID: {$subject->pivot->id}");
            $this->line("  Created: {$subject->pivot->created_at}");
            $this->line("  Updated: {$subject->pivot->updated_at}");
            $this->newLine();
        }
    }

    /**
     * Show relationships for a specific subject
     */
    protected function showSubjectRelationships($subjectId)
    {
        $subject = Subject::find($subjectId);

        if (! $subject) {
            $this->error("Subject with ID {$subjectId} not found.");

            return;
        }

        $this->info("=== Tags associated with Subject: {$subject->name} (ID: {$subject->id}) ===");
        $this->newLine();

        // Method 1: Using Eloquent relationship
        $tags = $subject->tags;

        if ($tags->isEmpty()) {
            $this->warn('No tags associated with this subject.');

            return;
        }

        $this->table(
            ['Tag ID', 'Tag Text', 'Pivot Created At'],
            $tags->map(function ($tag) {
                return [
                    $tag->id,
                    $tag->tag_text,
                    $tag->pivot->created_at ?? 'N/A',
                ];
            })->toArray()
        );

        $this->newLine();
        $this->info("Total tags: {$tags->count()}");

        // Method 2: Access pivot attributes directly
        $this->newLine();
        $this->info('=== Pivot Table Details ===');
        foreach ($tags as $tag) {
            $this->line("Subject '{$subject->name}' <-> Tag '{$tag->tag_text}'");
            $this->line("  Pivot ID: {$tag->pivot->id}");
            $this->line("  Created: {$tag->pivot->created_at}");
            $this->line("  Updated: {$tag->pivot->updated_at}");
            $this->newLine();
        }
    }

    /**
     * Show statistics about the pivot table
     */
    protected function showStatistics()
    {
        $this->info('=== Tag-Subject Pivot Table Statistics ===');
        $this->newLine();

        // Total relationships
        $totalRelationships = DB::table('subject_tag')->count();
        $this->info("Total relationships: {$totalRelationships}");

        // Subjects with most tags
        $subjectsWithMostTags = DB::table('subject_tag')
            ->join('subjects', 'subject_tag.subject_id', '=', 'subjects.id')
            ->select('subjects.id', 'subjects.name', DB::raw('COUNT(*) as tag_count'))
            ->groupBy('subjects.id', 'subjects.name')
            ->orderByDesc('tag_count')
            ->limit(10)
            ->get();

        $this->newLine();
        $this->info('=== Top 10 Subjects by Tag Count ===');
        $this->table(
            ['Subject ID', 'Subject Name', 'Tag Count'],
            $subjectsWithMostTags->map(function ($row) {
                return [$row->id, $row->name, $row->tag_count];
            })->toArray()
        );

        // Tags with most subjects
        $tagsWithMostSubjects = DB::table('subject_tag')
            ->join('tags', 'subject_tag.tag_id', '=', 'tags.id')
            ->select('tags.id', 'tags.tag_text', DB::raw('COUNT(*) as subject_count'))
            ->groupBy('tags.id', 'tags.tag_text')
            ->orderByDesc('subject_count')
            ->limit(10)
            ->get();

        $this->newLine();
        $this->info('=== Top 10 Tags by Subject Count ===');
        $this->table(
            ['Tag ID', 'Tag Text', 'Subject Count'],
            $tagsWithMostSubjects->map(function ($row) {
                return [$row->id, $row->tag_text, $row->subject_count];
            })->toArray()
        );

        // Orphaned tags (tags not associated with any subject)
        $orphanedTags = Tag::whereDoesntHave('subjects')->count();
        $this->newLine();
        $this->info("Orphaned tags (not associated with any subject): {$orphanedTags}");

        // Subjects without tags
        $subjectsWithoutTags = Subject::whereDoesntHave('tags')->count();
        $this->info("Subjects without tags: {$subjectsWithoutTags}");
    }
}
