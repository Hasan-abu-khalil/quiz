<?php

namespace App\Imports;

use App\Models\Question;
use App\Models\Subject;
use App\Models\Tag;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Events\BeforeSheet;
use PhpOffice\PhpSpreadsheet\IOFactory;

class QuestionsImport implements WithMultipleSheets
{
    protected $filePath;

    public function __construct($filePath = null)
    {
        $this->filePath = $filePath;
    }

    public function sheets(): array
    {
        $sheets = [];

        if ($this->filePath && file_exists($this->filePath)) {
            try {
                // Read the workbook to get all sheet names
                $spreadsheet = IOFactory::load($this->filePath);
                $sheetNames = $spreadsheet->getSheetNames();

                foreach ($sheetNames as $sheetName) {
                    $sheets[] = new QuestionsSheetImport($sheetName);
                }
            } catch (\Exception $e) {
                // Fallback: return a single sheet import that will process all sheets
                $sheets[] = new QuestionsSheetImport;
            }
        } else {
            // Fallback: return a single sheet import that will process all sheets
            $sheets[] = new QuestionsSheetImport;
        }

        return $sheets;
    }
}

class QuestionsSheetImport implements ToCollection, WithEvents, WithHeadingRow
{
    protected $subjectName;

    public function __construct($subjectName = null)
    {
        $this->subjectName = $subjectName ?? 'Unknown';
    }

    public function registerEvents(): array
    {
        return [
            BeforeSheet::class => function (BeforeSheet $event) {
                // If subject name wasn't set in constructor, get it from the sheet
                if ($this->subjectName === 'Unknown') {
                    $this->subjectName = $event->getSheet()->getTitle();
                }
            },
        ];
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Normalize headers - handle underscores and spaces
            $row = $row->mapWithKeys(function ($value, $key) {
                // Normalize: lowercase, trim, replace spaces with underscores
                $normalized = trim(strtolower(str_replace([' ', '-'], '_', $key)));

                return [$normalized => $value];
            });

            if (empty($row['question'])) {
                continue;
            }

            // Handle Subject: prefer column value, fallback to sheet name
            $subjectName = trim((string) ($row['subject'] ?? $this->subjectName ?? 'Unknown'));
            $subject = Subject::firstOrCreate([
                'name' => $subjectName,
            ]);

            // Build question data
            $questionData = [
                'subject_id' => $subject->id,
                'question_text' => trim($row['question']),
                'created_by' => auth()->id(),
            ];

            // Options - fixed structure: option_a, option_b, option_c, option_d, option_e
            $options = [
                trim((string) ($row['option_a'] ?? '')),
                trim((string) ($row['option_b'] ?? '')),
                trim((string) ($row['option_c'] ?? '')),
                trim((string) ($row['option_d'] ?? '')),
                trim((string) ($row['option_e'] ?? '')),
            ];

            // Correct answer (a–e)
            $correctRaw = strtolower(trim((string) ($row['correct_answer'] ?? '')));
            // Extract just the letter (a, b, c, d, e) from the value
            $correctRaw = preg_replace('/[^a-e]/', '', $correctRaw);

            $map = [
                'a' => 0,
                'b' => 1,
                'c' => 2,
                'd' => 3,
                'e' => 4,
            ];

            $correctIndex = $map[$correctRaw] ?? null;

            // Build explanations JSON structure
            // Structure: { correct, wrong, option1, option2, ... }
            // - "correct": Explanation for the correct answer (from Excel "Explanation" column)
            // - "wrong": Optional fallback for all wrong answers (user can add manually)
            // - "option1", "option2", etc.: Optional specific explanations per option (user can add manually)
            $explanations = [];

            // Get correct explanation from "Explanation" column in Excel
            $correctExplanation = trim((string) ($row['explanation'] ?? ''));
            if (! empty($correctExplanation)) {
                $explanations['correct'] = $correctExplanation;
            }

            // Only add explanations if we have at least one
            if (! empty($explanations)) {
                $questionData['explanations'] = $explanations;
            }

            $question = Question::create($questionData);

            // Create options
            foreach ($options as $index => $text) {
                if ($text === '') {
                    continue;
                }

                $question->options()->create([
                    'option_text' => $text,
                    'is_correct' => ($correctIndex === $index),
                ]);
            }

            // Tags - handle both Topic and Sub_Topic
            $tagsToSync = [];

            // Topic tag
            if (! empty($row['topic'])) {
                $topicTag = Tag::firstOrCreate([
                    'tag_text' => trim((string) $row['topic']),
                ]);
                $tagsToSync[] = $topicTag->id;
            }

            // Sub_Topic tag (handle various formats: sub_topic, subtopic, sub-topic)
            $subTopic = $row['sub_topic'] ?? $row['subtopic'] ?? '';
            if (! empty($subTopic)) {
                $subTopicTag = Tag::firstOrCreate([
                    'tag_text' => trim((string) $subTopic),
                ]);
                $tagsToSync[] = $subTopicTag->id;
            }

            // Sync all tags (replace existing with imported tags)
            if (! empty($tagsToSync)) {
                $question->tags()->sync($tagsToSync);
            }
        }
    }
}
