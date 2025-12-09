@extends('student.layout')

@section('title', 'Attempt Details')

@section('content')
    @php
        $quiz = $attempt->quiz;
    @endphp

    <div class="row mb-3">
        <div class="col-md-8">
            <h3 class="mb-1">{{ $quiz->title }}</h3>
            <p class="text-muted mb-0">
                Score: <strong>{{ $attempt->score }}</strong> |
                Correct: <strong class="text-success">{{ $attempt->total_correct }}</strong> |
                Incorrect: <strong class="text-danger">{{ $attempt->total_incorrect }}</strong>
            </p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
            <a href="{{ route('student.attempts.index') }}" class="btn btn-outline-secondary btn-sm">
                Back to attempts
            </a>
            <a href="{{ route('student.dashboard') }}" class="btn btn-primary btn-sm">
                Back to dashboard
            </a>
        </div>
    </div>

    @foreach ($answers as $aIndex => $answer)
        @php
            $question = $answer->question;
            $selectedId = $answer->selected_option_id;
            $correctOption = $question->options->firstWhere('is_correct', true);
        @endphp

        <div class="card card-shadow mb-3">
            <div class="card-body">
                <h5>
                    Q{{ $answers->firstItem() + $aIndex }}. {{ $question->question_text }}
                </h5>

                @foreach ($question->options as $option)
                    @php
                        $isSelected = $option->id == $selectedId;
                        $isCorrect = $option->is_correct;
                    @endphp

                    <div class="d-flex align-items-center mb-1">
                        <span class="me-2">
                            @if($isCorrect)
                                ✅
                            @elseif($isSelected && !$isCorrect)
                                ❌
                            @else
                                •
                            @endif
                        </span>
                        <span @class([
                            'fw-bold' => $isSelected || $isCorrect,
                            'text-success' => $isCorrect,
                            'text-danger' => $isSelected && !$isCorrect,
                        ])>
                            {{ $option->option_text }}
                            @if($isSelected) (Your answer) @endif
                            @if($isCorrect) (Correct) @endif
                        </span>
                    </div>
                @endforeach
            </div>
        </div>
    @endforeach

    {{-- Pagination --}}
    <div class="p-3">
        @if ($answers->lastPage() > 1)
            <nav>
                <ul class="pagination justify-content-center">

                    {{-- First Page --}}
                    <li class="page-item {{ $answers->currentPage() == 1 ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $answers->url(1) }}">1</a>
                    </li>

                    {{-- Left Ellipsis --}}
                    @if ($answers->currentPage() > 4)
                        <li class="page-item disabled"><span class="page-link">...</span></li>
                    @endif

                    {{-- Sliding Range --}}
                    @php
                        $start = max(2, $answers->currentPage() - 2);
                        $end = min($answers->lastPage() - 1, $answers->currentPage() + 2);
                    @endphp

                    @for ($i = $start; $i <= $end; $i++)
                        <li class="page-item {{ $answers->currentPage() == $i ? 'active' : '' }}">
                            <a class="page-link" href="{{ $answers->url($i) }}">{{ $i }}</a>
                        </li>
                    @endfor

                    {{-- Right Ellipsis --}}
                    @if ($answers->currentPage() < $answers->lastPage() - 3)
                        <li class="page-item disabled"><span class="page-link">...</span></li>
                    @endif

                    {{-- Last Page --}}
                    <li class="page-item {{ $answers->currentPage() == $answers->lastPage() ? 'disabled' : '' }}">
                        <a class="page-link" href="{{ $answers->url($answers->lastPage()) }}">
                            {{ $answers->lastPage() }}
                        </a>
                    </li>

                </ul>
            </nav>
        @endif
    </div>
@endsection