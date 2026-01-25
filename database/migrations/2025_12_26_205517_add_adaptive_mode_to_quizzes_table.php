<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // public function up(): void
    // {
    //     // Remove 'timed' (it's a property, not a mode), add 'adaptive' for querying purposes
    //     DB::statement("ALTER TABLE quizzes MODIFY COLUMN mode ENUM('by_subject', 'mixed_bag', 'adaptive') DEFAULT 'by_subject'");
    // }


    public function up(): void
{
    if (DB::getDriverName() === 'mysql') {
        DB::statement("
            ALTER TABLE quizzes
            MODIFY COLUMN mode
            ENUM('by_subject', 'mixed_bag', 'adaptive')
            DEFAULT 'by_subject'
        ");
    }
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original enum values
        DB::statement("ALTER TABLE quizzes MODIFY COLUMN mode ENUM('by_subject', 'mixed_bag', 'timed') DEFAULT 'by_subject'");
    }
};
