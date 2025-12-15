<?php

use App\Http\Controllers\PermissionRoleController;
use App\Http\Controllers\PermissionsController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuestionOptionController;
use App\Http\Controllers\QuestionTagController;
use App\Http\Controllers\QuizAnswerController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizQuestionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RoleUserController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Admin Dashboard (Inertia React)
Route::get('/admin', function () {
    return \Inertia\Inertia::render('admin/Dashboard');
})->name('admin.dashboard');

// Admin-only routes - Users management
Route::middleware(['auth', 'can.access'])->group(function () {
    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/admin/users/{id}', [UserController::class, 'show'])->name('admin.users.show');
    Route::post('/admin/users', [UserController::class, 'create'])->name('admin.users.create');
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});

// Admin/Teacher routes - These will use Inertia React
Route::middleware(['auth', 'role:admin,teacher'])->group(function () {

    // Role
    Route::get('/admin/roles', [RoleController::class, 'index'])->name('admin.roles.index');
    Route::get('/admin/roles/{id}', [RoleController::class, 'show'])->name('admin.roles.show');
    Route::post('/admin/roles', [RoleController::class, 'create'])->name('admin.roles.create');
    Route::get('/admin/roles/{id}/edit', [RoleController::class, 'edit'])->name('admin.roles.edit');
    Route::post('/admin/roles/{id}', [RoleController::class, 'update'])->name('admin.roles.update');
    Route::delete('/admin/roles/{id}', [RoleController::class, 'destroy'])->name('admin.roles.destroy');

    // RoleUser
    Route::get('/admin/role-users', [RoleUserController::class, 'index'])->name('admin.roleUsers.index');
    Route::get('/admin/role-users/{id}', [RoleUserController::class, 'show'])->name('admin.roleUsers.show');
    Route::post('/admin/role-users', [RoleUserController::class, 'create'])->name('admin.roleUsers.create');
    Route::get('/admin/role-users/{id}/edit', [RoleUserController::class, 'edit'])->name('admin.roleUsers.edit');
    Route::post('/admin/role-users/{id}', [RoleUserController::class, 'update'])->name('admin.roleUsers.update');
    Route::delete('/admin/role-users/{id}', [RoleUserController::class, 'destroy'])->name('admin.roleUsers.destroy');

    // Permission
    Route::get('/admin/permissions', [PermissionsController::class, 'index'])->name('admin.permissions.index');
    Route::get('/admin/permissions/{id}', [PermissionsController::class, 'show'])->name('admin.permissions.show');
    Route::post('/admin/permissions', [PermissionsController::class, 'create'])->name('admin.permissions.create');
    Route::get('/admin/permissions/{id}/edit', [PermissionsController::class, 'edit'])->name('admin.permissions.edit');
    Route::post('/admin/permissions/{id}', [PermissionsController::class, 'update'])->name('admin.permissions.update');
    Route::delete('/admin/permissions/{id}', [PermissionsController::class, 'destroy'])->name('admin.permissions.destroy');

    // PermissionRole
    Route::get('/admin/permission-roles', [PermissionRoleController::class, 'index'])->name('admin.permissionRoles.index');
    Route::get('/admin/permission-roles/{id}', [PermissionRoleController::class, 'show'])->name('admin.permissionRoles.show');
    Route::post('/admin/permission-roles', [PermissionRoleController::class, 'create'])->name('admin.permissionRoles.create');
    Route::get('/admin/permission-roles/{id}/edit', [PermissionRoleController::class, 'edit'])->name('admin.permissionRoles.edit');
    Route::post('/admin/permission-roles/{id}', [PermissionRoleController::class, 'update'])->name('admin.permissionRoles.update');
    Route::delete('/admin/permission-roles/{id}', [PermissionRoleController::class, 'destroy'])->name('admin.permissionRoles.destroy');

    // Subject
    Route::get('/admin/subjects', [SubjectController::class, 'index'])->name('admin.subjects.index');
    Route::get('/admin/subjects/{id}', [SubjectController::class, 'show'])->name('admin.subjects.show');
    Route::post('/admin/subjects', [SubjectController::class, 'create'])->name('admin.subjects.create');
    Route::get('/admin/subjects/{id}/edit', [SubjectController::class, 'edit'])->name('admin.subjects.edit');
    Route::post('/admin/subjects/{id}', [SubjectController::class, 'update'])->name('admin.subjects.update');
    Route::delete('/admin/subjects/{id}', [SubjectController::class, 'destroy'])->name('admin.subjects.destroy');
    Route::delete('/admin/subjects/bulk', [SubjectController::class, 'bulkDestroy'])->name('admin.subjects.bulkDestroy');

    // Question
    Route::post('/admin/questions/import', [QuestionController::class, 'import'])
        ->name('admin.questions.import');
    Route::get('/admin/questions', [QuestionController::class, 'index'])->name('admin.questions.index');
    Route::get('/admin/questions/create', [QuestionController::class, 'createForm'])->name('admin.questions.createForm');
    Route::post('/admin/questions', [QuestionController::class, 'create'])->name('admin.questions.create');
    Route::get('/admin/questions/review', [QuestionController::class, 'reviewIndex'])->name('admin.questions.review.index');
    Route::get('/admin/questions/my-review', [QuestionController::class, 'myReviewIndex'])->name('admin.questions.myReview.index');
    Route::post('/admin/questions/{id}/assign', [QuestionController::class, 'assign'])->name('admin.questions.assign');
    Route::post('/admin/questions/{id}/unassign', [QuestionController::class, 'unassign'])->name('admin.questions.unassign');
    Route::post('/admin/questions/{id}/change-state', [QuestionController::class, 'changeState'])->name('admin.questions.changeState');
    Route::delete('/admin/questions/bulk', [QuestionController::class, 'bulkDestroy'])->name('admin.questions.bulkDestroy');
    Route::middleware('can.access:question')->group(function () {
        Route::get('/admin/questions/{id}', [QuestionController::class, 'show'])->name('admin.questions.show');
        Route::get('/admin/questions/{id}/edit', [QuestionController::class, 'edit'])->name('admin.questions.edit');
        Route::post('/admin/questions/{id}', [QuestionController::class, 'update'])->name('admin.questions.update');
        Route::delete('/admin/questions/{id}', [QuestionController::class, 'destroy'])->name('admin.questions.destroy');

    });

    // QuestionOption
    Route::get('/admin/question-options', [QuestionOptionController::class, 'index'])->name('admin.questionOptions.index');
    Route::get('/admin/question-options/{id}', [QuestionOptionController::class, 'show'])->name('admin.questionOptions.show');
    Route::post('/admin/question-options', [QuestionOptionController::class, 'create'])->name('admin.questionOptions.create');
    Route::get('/admin/question-options/{id}/edit', [QuestionOptionController::class, 'edit'])->name('admin.questionOptions.edit');
    Route::post('/admin/question-options/{id}', [QuestionOptionController::class, 'update'])->name('admin.questionOptions.update');
    Route::delete('/admin/question-options/{id}', [QuestionOptionController::class, 'destroy'])->name('admin.questionOptions.destroy');

    // Quiz (admin/teacher)
    Route::get('/admin/quizzes', [QuizController::class, 'index'])->name('admin.quizzes.index');
    Route::post('/admin/quizzes', [QuizController::class, 'create'])->name('admin.quizzes.create');
    Route::delete('/admin/quizzes/bulk', [QuizController::class, 'bulkDestroy'])->name('admin.quizzes.bulkDestroy');
    Route::middleware('can.access:quiz')->group(function () {
        Route::get('/admin/quizzes/{id}', [QuizController::class, 'show'])->name('admin.quizzes.show');
        Route::get('/admin/quizzes/{id}/edit', [QuizController::class, 'edit'])->name('admin.quizzes.edit');
        Route::post('/admin/quizzes/{id}', [QuizController::class, 'update'])->name('admin.quizzes.update');
        Route::delete('/admin/quizzes/{id}', [QuizController::class, 'destroy'])->name('admin.quizzes.destroy');
        Route::delete('/admin/quizzes/{quiz}/questions/{question}', [QuizController::class, 'destroyQuestion'])->name('admin.quizzes.questions.destroy');
        Route::put('/admin/quizzes/{quiz}/questions/{question}', [QuizController::class, 'updateQuestion']);
        Route::post('/admin/quizzes/{quiz}/questions', [QuizController::class, 'storeQuestion']);
        Route::get('/admin/questions/by-subject/{subjectId}', function ($subjectId) {
            return \App\Models\Question::where('subject_id', $subjectId)
                ->where('state', \App\Models\Question::STATE_DONE)
                ->select('id', 'question_text')
                ->get();
        })->name('admin.questions.bySubject');

        Route::put('/admin/quizzes/{quiz}/questions/{quizQuestion}/order', [QuizController::class, 'updateOrder'])
            ->name('quizzes.questions.updateOrder');

    });

    // QuizQuestion
    Route::get('/admin/quiz-questions', [QuizQuestionController::class, 'index'])->name('admin.quizQuestions.index');
    Route::get('/admin/quiz-questions/{id}', [QuizQuestionController::class, 'show'])->name('admin.quizQuestions.show');
    Route::post('/admin/quiz-questions', [QuizQuestionController::class, 'create'])->name('admin.quizQuestions.create');
    Route::get('/admin/quiz-questions/{id}/edit', [QuizQuestionController::class, 'edit'])->name('admin.quizQuestions.edit');
    Route::post('/admin/quiz-questions/{id}', [QuizQuestionController::class, 'update'])->name('admin.quizQuestions.update');
    Route::delete('/admin/quiz-questions/{id}', [QuizQuestionController::class, 'destroy'])->name('admin.quizQuestions.destroy');

    // Attempt (for teachers/admin to view)
    Route::get('/admin/attempts', [QuizAttemptController::class, 'index'])->name('admin.attempts.index');
    Route::get('/admin/attempts/{id}', [QuizAttemptController::class, 'show'])->name('admin.attempts.show');
    Route::post('/admin/attempts', [QuizAttemptController::class, 'create'])->name('admin.attempts.create');
    Route::get('/admin/attempts/{id}/edit', [QuizAttemptController::class, 'edit'])->name('admin.attempts.edit');
    Route::post('/admin/attempts/{id}', [QuizAttemptController::class, 'update'])->name('admin.attempts.update');
    Route::delete('/admin/attempts/{id}', [QuizAttemptController::class, 'destroy'])->name('admin.attempts.destroy');

    // Answers (for reporting)
    Route::get('/admin/answers', [QuizAnswerController::class, 'index'])->name('admin.answers.index');
    Route::get('/admin/answers/{id}', [QuizAnswerController::class, 'show'])->name('admin.answers.show');
    Route::post('/admin/answers', [QuizAnswerController::class, 'create'])->name('admin.answers.create');

    // Tag
    Route::get('/admin/tags', [TagController::class, 'index'])->name('admin.tags.index');
    Route::get('/admin/tags/{id}', [TagController::class, 'show'])->name('admin.tags.show');
    Route::post('/admin/tags', [TagController::class, 'create'])->name('admin.tags.create');
    Route::get('/admin/tags/{id}/edit', [TagController::class, 'edit'])->name('admin.tags.edit');
    Route::post('/admin/tags/{id}', [TagController::class, 'update'])->name('admin.tags.update');
    Route::delete('/admin/tags/{id}', [TagController::class, 'destroy'])->name('admin.tags.destroy');
    Route::delete('/admin/tags/bulk', [TagController::class, 'bulkDestroy'])->name('admin.tags.bulkDestroy');

    // QuestionTag
    Route::get('/admin/question-tags', [QuestionTagController::class, 'index'])->name('admin.questionTags.index');
    Route::get('/admin/question-tags/{id}', [QuestionTagController::class, 'show'])->name('admin.questionTags.show');
    Route::post('/admin/question-tags', [QuestionTagController::class, 'create'])->name('admin.questionTags.create');
    Route::get('/admin/question-tags/{id}/edit', [QuestionTagController::class, 'edit'])->name('admin.questionTags.edit');
    Route::post('/admin/question-tags/{id}', [QuestionTagController::class, 'update'])->name('admin.questionTags.update');
    Route::delete('/admin/question-tags/{id}', [QuestionTagController::class, 'destroy'])->name('admin.questionTags.destroy');
});
