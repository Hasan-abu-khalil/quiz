<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    /** @use HasFactory<\Database\Factories\TagFactory> */
    use HasFactory;

    protected $fillable = [
        'tag_text',
    ];

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'question_tags');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_tag')
            ->withTimestamps();
    }
}
