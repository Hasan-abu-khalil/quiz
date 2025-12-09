@extends('student.layout')

@section('title', 'Student Dashboard')

@section('content')
    <div class="row mb-4">
        <div class="col">
            <h3 class="mb-1">Welcome, {{ auth()->user()->name }}</h3>
            <p class="text-muted mb-0">Choose a subject to see quizzes.</p>
        </div>
    </div>

    <div class="row">
        @forelse ($subjects as $subject)
            <div class="col-md-4 mb-3">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">{{ $subject->name }}</h5>
                        <div class="mt-auto">
                            <a href="{{ route('student.subject.quizzes', $subject->id) }}" class="btn btn-primary w-100">
                                View Quizzes
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <p class="text-muted">No subjects available yet.</p>
        @endforelse
    </div>


    {{-- Pagination --}}
    <div class="p-3">
        @if ($subjects->lastPage() > 1)
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item {{ $subjects->currentPage() == 1 ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $subjects->url(1) }}">1</a>
                    </li>

                    @php
                        $start = max(2, $subjects->currentPage() - 2);
                        $end = min($subjects->lastPage() - 1, $subjects->currentPage() + 2);
                    @endphp

                    @for ($i = $start; $i <= $end; $i++)
                        <li class="page-item {{ $subjects->currentPage() == $i ? 'active' : '' }}">
                            <a class="page-link" href="{{ $subjects->url($i) }}">{{ $i }}</a>
                        </li>
                    @endfor

                    <li class="page-item {{ $subjects->currentPage() == $subjects->lastPage() ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $subjects->url($subjects->lastPage()) }}">
                            {{ $subjects->lastPage() }}
                        </a>
                    </li>
                </ul>
            </nav>
        @endif
    </div>



    
    <hr class="my-4">

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Your Recent Attempts</h4>
        <a href="{{ route('student.attempts.index') }}" class="btn btn-outline-secondary btn-sm">
            View all attempts
        </a>
    </div>

    <div class="row mb-4">
        @forelse ($lastAttempts as $attempt)
            <div class="col-md-4 mb-3">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">{{ $attempt->quiz->title }}</h6>
                        <p class="card-text text-muted mb-1">
                            Score: {{ $attempt->score ?? 0 }} / {{ $attempt->quiz->questions->count() }}
                        </p>
                        <p class="card-text text-muted mb-2">
                            Attempted: {{ $attempt->created_at->format('d M Y, H:i') }}
                        </p>
                        <div class="mt-auto">
                            <a href="{{ route('student.attempts.show', $attempt->id) }}" class="btn btn-primary btn-sm w-100">
                                View Attempt
                            </a>
                            @if(!$attempt->ended_at)
                                <a href="{{ route('student.attempts.resume', $attempt->id) }}"
                                    class="btn btn-warning btn-sm mt-1 w-100">
                                    Resume Quiz
                                </a>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <p class="text-muted">You have no recent attempts.</p>
        @endforelse
    </div>
@endsection