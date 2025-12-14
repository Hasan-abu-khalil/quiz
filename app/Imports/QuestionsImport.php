<?php

namespace App\Imports;

use App\Models\Question;
use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class QuestionsImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {

            // Normalize headers
            $row = $row->mapWithKeys(fn($value, $key) => [
                trim(strtolower($key)) => $value
            ]);

            if (empty($row['question'])) {
                continue;
            }

            $subject = Subject::firstOrCreate([
                'name' => trim((string) ($row['subject'] ?? 'Unknown')),
            ]);

            $question = Question::create([
                'subject_id' => $subject->id,
                'question_text' => trim($row['question']),
                'created_by' => auth()->id(),
            ]);

            // Options
            $options = [
                trim((string) ($row['option_a'] ?? '')),
                trim((string) ($row['option_b'] ?? '')),
                trim((string) ($row['option_c'] ?? '')),
                trim((string) ($row['option_d'] ?? '')),
                trim((string) ($row['option_e'] ?? '')),
            ];

            // Correct answer (a–e)
            $correctRaw = strtolower(trim((string) ($row['correct_answer'] ?? '')));


            $map = [
                'a' => 0,
                'b' => 1,
                'c' => 2,
                'd' => 3,
                'e' => 4,
            ];

            $correctIndex = $map[$correctRaw] ?? null;

            foreach ($options as $index => $text) {
                if ($text === '') {
                    continue;
                }

                $question->options()->create([
                    'option_text' => $text,
                    'is_correct' => ($correctIndex === $index),
                ]);
            }

            // Tags
            if (!empty($row['topic'])) {
                $tag = Tag::firstOrCreate([
                    'tag_text' => trim($row['topic']),
                ]);

                $question->tags()->syncWithoutDetaching([$tag->id]);
            }
        }
    }
}
