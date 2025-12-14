<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Single JSON field to store all explanations:
            // - "correct": Explanation for the correct answer (from Excel "Explanation" column)
            // - "wrong": Optional fallback for all wrong answers (user can add manually)
            // - "option1", "option2", etc.: Optional specific explanations per option (user can add manually)
            $table->json('explanations')->nullable()->after('question_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('explanations');
        });
    }
};
