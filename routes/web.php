<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PermissionRoleController;
use App\Http\Controllers\PermissionsController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuestionOptionController;
use App\Http\Controllers\QuestionTagController;
use App\Http\Controllers\QuizAnswerController;
use App\Http\Controllers\QuizAttemptController;
use App\Http\Controllers\QuizController; // ADMIN quiz controller
use App\Http\Controllers\QuizQuestionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RoleUserController;
use App\Http\Controllers\Student\AttemptController;
use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\QuizController as StudentQuizController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// -------------------- Guest (login / register) --------------------
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');

    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.post');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// -------------------- Admin + Teacher (Legacy Blade Routes) --------------------
// NOTE: These routes are being migrated to Inertia React in routes/admin.php
// Keeping them temporarily for backward compatibility during migration
// Once migration is complete, these will be removed
Route::middleware(['auth', 'role:admin,teacher'])->group(function () {

    // Users
    Route::get('/User', [UserController::class, 'index'])->name('users.index');
    Route::get('/User/{id}', [UserController::class, 'show'])->name('users.show');
    Route::post('/User', [UserController::class, 'create'])->name('users.create');
    Route::delete('/User/{id}', [UserController::class, 'destroy'])->name('users.destroy');

    // Role
    Route::get('/Role', [RoleController::class, 'index'])->name('role.index');
    Route::get('/Role/{id}', [RoleController::class, 'show'])->name('role.show');
    Route::post('/Role', [RoleController::class, 'create'])->name('role.create');
    Route::get('/Role/{id}/edit', [RoleController::class, 'edit'])->name('role.edit');
    Route::post('/Role/{id}', [RoleController::class, 'update'])->name('role.update');
    Route::delete('/Role/{id}', [RoleController::class, 'destroy'])->name('role.destroy');

    // RoleUser
    Route::get('/RoleUser', [RoleUserController::class, 'index'])->name('roleUser.index');
    Route::get('/RoleUser/{id}', [RoleUserController::class, 'show'])->name('roleUser.show');
    Route::post('/RoleUser', [RoleUserController::class, 'create'])->name('roleUser.create');
    Route::get('/RoleUser/{id}/edit', [RoleUserController::class, 'edit'])->name('roleUser.edit');
    Route::post('/RoleUser/{id}', [RoleUserController::class, 'update'])->name('roleUser.update');
    Route::delete('/RoleUser/{id}', [RoleUserController::class, 'destroy'])->name('roleUser.destroy');

    // Permission
    Route::get('/Permission', [PermissionsController::class, 'index'])->name('permission.index');
    Route::get('/Permission/{id}', [PermissionsController::class, 'show'])->name('permission.show');
    Route::post('/Permission', [PermissionsController::class, 'create'])->name('permission.create');
    Route::get('/Permission/{id}/edit', [PermissionsController::class, 'edit'])->name('permission.edit');
    Route::post('/Permission/{id}', [PermissionsController::class, 'update'])->name('permission.update');
    Route::delete('/Permission/{id}', [PermissionsController::class, 'destroy'])->name('permission.destroy');

    // PermissionRole
    Route::get('/PermissionRole', [PermissionRoleController::class, 'index'])->name('permissionRole.index');
    Route::get('/PermissionRole/{id}', [PermissionRoleController::class, 'show'])->name('permissionRole.show');
    Route::post('/PermissionRole', [PermissionRoleController::class, 'create'])->name('permissionRole.create');
    Route::get('/PermissionRole/{id}/edit', [PermissionRoleController::class, 'edit'])->name('permissionRole.edit');
    Route::post('/PermissionRole/{id}', [PermissionRoleController::class, 'update'])->name('permissionRole.update');
    Route::delete('/PermissionRole/{id}', [PermissionRoleController::class, 'destroy'])->name('permissionRole.destroy');

    // Subject
    Route::get('/Subject', [SubjectController::class, 'index'])->name('subject.index');
    Route::get('/Subject/{id}', [SubjectController::class, 'show'])->name('subject.show');
    Route::post('/Subject', [SubjectController::class, 'create'])->name('subject.create');
    Route::get('/Subject/{id}/edit', [SubjectController::class, 'edit'])->name('subject.edit');
    Route::post('/Subject/{id}', [SubjectController::class, 'update'])->name('subject.update');
    Route::delete('/Subject/{id}', [SubjectController::class, 'destroy'])->name('subject.destroy');

    // Question
    Route::get('/Question', [QuestionController::class, 'index'])->name('question.index');
    Route::get('/Question/{id}', [QuestionController::class, 'show'])->name('question.show');
    Route::post('/Question', [QuestionController::class, 'create'])->name('question.create');
    Route::get('/Question/{id}/edit', [QuestionController::class, 'edit'])->name('question.edit');
    Route::post('/Question/{id}', [QuestionController::class, 'update'])->name('question.update');
    Route::delete('/Question/{id}', [QuestionController::class, 'destroy'])->name('question.destroy');

    // QuestionOption
    Route::get('/QuestionOption', [QuestionOptionController::class, 'index'])->name('questionOption.index');
    Route::get('/QuestionOption/{id}', [QuestionOptionController::class, 'show'])->name('questionOption.show');
    Route::post('/QuestionOption', [QuestionOptionController::class, 'create'])->name('questionOption.create');
    Route::get('/QuestionOption/{id}/edit', [QuestionOptionController::class, 'edit'])->name('questionOption.edit');
    Route::post('/QuestionOption/{id}', [QuestionOptionController::class, 'update'])->name('questionOption.update');
    Route::delete('/QuestionOption/{id}', [QuestionOptionController::class, 'destroy'])->name('questionOption.destroy');

    // Quiz (admin/teacher)
    Route::get('/Quiz', [QuizController::class, 'index'])->name('quiz.index');
    Route::get('/Quiz/{id}', [QuizController::class, 'show'])->name('quiz.show');
    Route::post('/Quiz', [QuizController::class, 'create'])->name('quiz.create');
    Route::get('/Quiz/{id}/edit', [QuizController::class, 'edit'])->name('quiz.edit');
    Route::post('/Quiz/{id}', [QuizController::class, 'update'])->name('quiz.update');
    Route::delete('/Quiz/{id}', [QuizController::class, 'destroy'])->name('quiz.destroy');

    // QuizQuestion
    Route::get('/QuizQuestion', [QuizQuestionController::class, 'index'])->name('quizQuestion.index');
    Route::get('/QuizQuestion/{id}', [QuizQuestionController::class, 'show'])->name('quizQuestion.show');
    Route::post('/QuizQuestion', [QuizQuestionController::class, 'create'])->name('quizQuestion.create');
    Route::get('/QuizQuestion/{id}/edit', [QuizQuestionController::class, 'edit'])->name('quizQuestion.edit');
    Route::post('/QuizQuestion/{id}', [QuizQuestionController::class, 'update'])->name('quizQuestion.update');
    Route::delete('/QuizQuestion/{id}', [QuizQuestionController::class, 'destroy'])->name('quizQuestion.destroy');

    // Attempt (for teachers/admin to view)
    Route::get('/Attempt', [QuizAttemptController::class, 'index'])->name('attempt.index');
    Route::get('/Attempt/{id}', [QuizAttemptController::class, 'show'])->name('attempt.show');
    Route::post('/Attempt', [QuizAttemptController::class, 'create'])->name('attempt.create');
    Route::get('/Attempt/{id}/edit', [QuizAttemptController::class, 'edit'])->name('attempt.edit');
    Route::post('/Attempt/{id}', [QuizAttemptController::class, 'update'])->name('attempt.update');
    Route::delete('/Attempt/{id}', [QuizAttemptController::class, 'destroy'])->name('attempt.destroy');

    // Answers (for reporting)
    Route::get('/Answers', [QuizAnswerController::class, 'index'])->name('answer.index');
    Route::get('/Answers/{id}', [QuizAnswerController::class, 'show'])->name('answer.show');
    Route::post('/Answers', [QuizAnswerController::class, 'create'])->name('answer.create');

    // Tag
    Route::get('/Tag', [TagController::class, 'index'])->name('tag.index');
    Route::get('/Tag/{id}', [TagController::class, 'show'])->name('tag.show');
    Route::post('/Tag', [TagController::class, 'create'])->name('tag.create');
    Route::get('/Tag/{id}/edit', [TagController::class, 'edit'])->name('tag.edit');
    Route::post('/Tag/{id}', [TagController::class, 'update'])->name('tag.update');
    Route::delete('/Tag/{id}', [TagController::class, 'destroy'])->name('tag.destroy');

    // QuestionTag
    Route::get('/QuestionTag', [QuestionTagController::class, 'index'])->name('questionTag.index');
    Route::get('/QuestionTag/{id}', [QuestionTagController::class, 'show'])->name('questionTag.show');
    Route::post('/QuestionTag', [QuestionTagController::class, 'create'])->name('questionTag.create');
    Route::get('/QuestionTag/{id}/edit', [QuestionTagController::class, 'edit'])->name('questionTag.edit');
    Route::post('/QuestionTag/{id}', [QuestionTagController::class, 'update'])->name('questionTag.update');
    Route::delete('/QuestionTag/{id}', [QuestionTagController::class, 'destroy'])->name('questionTag.destroy');
});

// -------------------- Student Area --------------------
Route::middleware(['auth'])->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('student.dashboard');
    Route::get('dashboard/subjects/{id}/quizzes', [DashboardController::class, 'quizzesBySubject'])->name('student.subject.quizzes');

    // Show quiz info + "Start quiz" button
    Route::get('/student/quizzes/{quiz}', [StudentQuizController::class, 'show'])
        ->name('student.quizzes.show');

    // Start quiz (create QuizAttempt + redirect to questions page)
    Route::post('/student/quizzes/{quiz}/start', [StudentQuizController::class, 'start'])
        ->name('student.quizzes.start');

    // Take quiz (show questions)
    // Route::get('/student/attempts/{attempt}', [StudentQuizController::class, 'take'])
    //     ->name('student.attempts.take');

    Route::get('/student/attempts/{attempt}/question/{questionIndex}', [StudentQuizController::class, 'take'])
        ->name('student.attempts.take.single');

    Route::post('/student/attempts/{attempt}/question/{questionIndex}/submit', [StudentQuizController::class, 'submitSingle'])
        ->name('student.attempts.submit.single');
    // Submit quiz answers
    Route::post('/student/attempts/{attempt}/submit', [StudentQuizController::class, 'submit'])
        ->name('student.attempts.submit');

    // Student attempts history
    Route::get('/student/attempts', [AttemptController::class, 'index'])
        ->name('student.attempts.index');

    // View attempt details
    Route::get('/student/attempts/{attempt}/show', [AttemptController::class, 'show'])
        ->name('student.attempts.show');

    Route::get('attempts/{attempt}/resume', [AttemptController::class, 'resume'])
        ->name('student.attempts.resume');
});
