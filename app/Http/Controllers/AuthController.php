<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm(Request $request)
    {
        // If already logged in, send to dashboard
        if (auth()->check()) {
            $user = auth()->user();
            if ($user->hasRole('admin') || $user->hasRole('teacher')) {
                return redirect()->route('admin.dashboard');
            }

            return redirect()->route('student.dashboard');
        }

        // For Inertia requests, render Inertia login page
        if ($this->wantsInertiaResponse($request)) {
            return \Inertia\Inertia::render('auth/Login');
        }

        // Legacy Blade view
        return view('auth.login');
    }

    /**
     * Handle the login request.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'remember' => ['nullable', 'boolean'],
        ], [

            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
        ];

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Check if this is an Inertia request
            $isInertiaRequest = $this->wantsInertiaResponse($request);

            if ($user->hasRole('admin')) {
                // Admin dashboard is Inertia, so regular redirect works
                return redirect()->route('admin.dashboard');
            }

            if ($user->hasRole('teacher')) {
                // Teacher dashboard is Inertia, so regular redirect works
                return redirect()->route('admin.dashboard');
            }

            // default: student or others
            if ($user->hasRole('student')) {
                // Student dashboard is Blade, so use Inertia::location() for full page navigation
                // This prevents Inertia from trying to render Blade view in iframe
                if ($isInertiaRequest) {
                    return \Inertia\Inertia::location(route('student.dashboard'));
                }

                return redirect()->route('student.dashboard');
            }

            // fallback
            return redirect()->route('users.index');
        }

        return back()
            ->withErrors(['email' => 'Invalid credentials'])
            ->withInput();
    }

    /**
     * Show the register form.
     */
    public function showRegisterForm()
    {
        if (auth()->check()) {
            return redirect()->route('users.index');
        }

        return view('auth.register');
    }

    /**
     * Handle the register request.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:users,name'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => ['required', 'string', 'min:6', 'max:100', 'confirmed'],
        ], [
            'name.required' => 'Name is required.',
            'email.unique' => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);
        // Default role: student
        $studentRole = Role::where('name', 'student')->first();

        if ($studentRole) {
            $user->roles()->attach($studentRole->id);   // 👈 pivot role_user
        }

        Auth::login($user);

        // After register, send student to student dashboard
        if ($user->hasRole('student')) {
            return redirect()->route('student.dashboard');
        }

        return redirect()->route('users.index');
    }

    /**
     * Logout the user.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Always redirect to login route
        return redirect()->route('login');
    }
}
