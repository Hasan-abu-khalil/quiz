@extends('student.layout')

@section('title', $subject->name . ' Quizzes')

@section('content')
    <div class="row mb-4">
        <div class="col">
            <h3 class="mb-1">{{ $subject->name }} Quizzes</h3>
            <p class="text-muted mb-0">Choose a quiz to start.</p>
        </div>
    </div>

    <div class="row">
         @forelse ($quizzes as $quiz)
            @if($quiz->questions->count() > 0)
                <div class="col-md-4 mb-3">
                    <div class="card card-shadow h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">{{ $quiz->title }}</h5>
                            <p class="card-text text-muted mb-1">
                                Mode: <strong>{{ ucfirst(str_replace('_', ' ', $quiz->mode)) }}</strong>
                            </p>
                            @if($quiz->time_limit_minutes)
                                <p class="card-text text-muted mb-2">
                                    Time limit: {{ $quiz->time_limit_minutes }} min
                                </p>
                            @endif
                            <div class="mt-auto">
                                <a href="{{ route('student.quizzes.show', $quiz->id) }}" class="btn btn-primary w-100">
                                    View & Start
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @empty
            <p class="text-muted">No quizzes available in this subject.</p>
        @endforelse
    </div>

    {{-- Pagination --}}
    <div class="p-3">
        @if ($quizzes->lastPage() > 1)
            <nav>
                <ul class="pagination justify-content-center">
                    <li class="page-item {{ $quizzes->currentPage() == 1 ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $quizzes->url(1) }}">1</a>
                    </li>

                    @php
                        $start = max(2, $quizzes->currentPage() - 2);
                        $end = min($quizzes->lastPage() - 1, $quizzes->currentPage() + 2);
                    @endphp

                    @for ($i = $start; $i <= $end; $i++)
                        <li class="page-item {{ $quizzes->currentPage() == $i ? 'active' : '' }}">
                            <a class="page-link" href="{{ $quizzes->url($i) }}">{{ $i }}</a>
                        </li>
                    @endfor

                    <li class="page-item {{ $quizzes->currentPage() == $quizzes->lastPage() ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $quizzes->url($quizzes->lastPage()) }}">
                            {{ $quizzes->lastPage() }}
                        </a>
                    </li>
                </ul>
            </nav>
        @endif
    </div>
@endsection
