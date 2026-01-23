import { Head, Link, router } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { route } from "ziggy-js";
import { CheckCircle2, XCircle, Circle, Flag } from "lucide-react";
import { SmartPagination } from "@/components/common/SmartPagination";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { cn } from "@/lib/utils";

interface Subject {
    id: number;
    name: string;
}

interface Option {
    id: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    question_text: string;
    subject: Subject | null;
    options: Option[];
    explanations?: Record<string, string>;
}

interface Answer {
    id: number | null;
    question_id: number;
    selected_option_id: number | null;
    is_correct: boolean | null;
    question: Question;
    is_flagged?: boolean;
}

interface Quiz {
    id: number;
    title: string;
}

interface Attempt {
    id: number;
    score: number;
    total_correct: number;
    total_incorrect: number;
    quiz: Quiz;
}

interface QuestionIndex {
    id: number;
    index: number;
    page: number;
    is_answered: boolean;
    is_correct: boolean | null;
}

interface Props {
    attempt: Attempt;
    answers: {
        data: Answer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    questions_index: QuestionIndex[];
}

export default function AttemptsShow({ attempt, answers, questions_index }: Props) {
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const scrollToQuestion = (questionId: number) => {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const navigateToQuestion = (questionId: number, page: number) => {
        // Navigate to the page containing the question
        const url = answers.links.find(
            (link) => link.label === String(page) && link.url,
        )?.url;

        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: false,
                onSuccess: () => {
                    // Scroll to question after page loads
                    setTimeout(() => {
                        scrollToQuestion(questionId);
                    }, 100);
                },
            });
        } else {
            // If already on the page, just scroll
            scrollToQuestion(questionId);
        }
    };

    const getQuestionColor = (q: QuestionIndex) => {
        console.log(q);
        if (!q.is_answered) {
            return 'text-gray-500 border-gray-500'; // Gray for unanswered
        }
        if (q.is_correct === true) {
            return 'text-green-500 border-green-500'; // Green for correct
        }
        return 'text-red-500 border-red-500'; // Red for incorrect
    };

    return (
        <StudentLayout title="Attempt Details">
            <Head title="Attempt Details" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {attempt.quiz.title}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-muted-foreground">
                                Total: <strong>{questions_index.length}</strong>
                            </span>
                            <span className="text-muted-foreground">
                                Correct:{" "}
                                <strong className="text-green-600">
                                    {attempt.total_correct}
                                </strong>
                            </span>
                            <span className="text-muted-foreground">
                                Incorrect:{" "}
                                <strong className="text-red-600">
                                    {attempt.total_incorrect}
                                </strong>
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route("student.attempts.index")}>
                                Back to attempts
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={route("student.dashboard")}>
                                Back to dashboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Question Navigation */}
                {questions_index && questions_index.length > 0 && (
                    <Card>
                        <CardContent className="p-0 flex flex-wrap gap-2">
                            {questions_index.map((q, index) => (
                                <button
                                    key={q.id}
                                    onClick={() => navigateToQuestion(q.id, q.page)}
                                    className={cn(
                                        'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold text-white transition-all hover:scale-110 shadow-sm',
                                        getQuestionColor(q),
                                        answers.current_page === q.page && 'ring-2 ring-blue-500 ring-offset-2'
                                    )}
                                    title={`Question ${q.index}${q.is_answered ? (q.is_correct ? ' (Correct)' : ' (Incorrect)') : ' (Unanswered)'}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {answers.data.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    No questions found for this quiz attempt.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        answers.data.map((answer, aIndex) => {
                            const question = answer.question;
                            if (!question) {
                                return null; // Skip if question is missing
                            }
                            const selectedId = answer.selected_option_id;

                            return (
                                <Card
                                    id={`question-${answer.question_id}`}
                                    key={
                                        answer.id ||
                                        `question-${answer.question_id}`
                                    }
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {question.subject && (
                                                    <SubjectBadge
                                                        subject={
                                                            question.subject
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (answer.is_flagged) {
                                                        router.delete(
                                                            route(
                                                                "student.questions.unflag",
                                                                question.id,
                                                            ),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    } else {
                                                        router.post(
                                                            route(
                                                                "student.questions.flag",
                                                                question.id,
                                                            ),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                                className={
                                                    answer.is_flagged
                                                        ? "text-yellow-500 hover:text-yellow-600"
                                                        : "text-muted-foreground hover:text-yellow-500"
                                                }
                                            >
                                                <Flag
                                                    className={`h-5 w-5 ${answer.is_flagged
                                                        ? "fill-current"
                                                        : ""
                                                        }`}
                                                />
                                            </Button>
                                        </div>
                                        <CardTitle>
                                            Q{answers.from + aIndex}.{" "}
                                            {question.question_text}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {question.options.map((option) => {
                                            const isSelected =
                                                option.id === selectedId;
                                            const isCorrect = option.is_correct;
                                            const studentAnswered = selectedId !== null;

                                            // تحديد لون النص والخلفية
                                            let textColor =
                                                "text-muted-foreground";
                                            let IconComponent = Circle;

                                            if (studentAnswered) {
                                                // Student answered - show check/X based on selection
                                                if (isSelected && isCorrect) {
                                                    textColor = "text-green-600";
                                                    IconComponent = CheckCircle2;
                                                } else if (
                                                    isSelected &&
                                                    !isCorrect
                                                ) {
                                                    textColor = "text-red-600";
                                                    IconComponent = XCircle;
                                                } else if (isCorrect) {
                                                    // Correct answer but not selected
                                                    textColor = "text-green-600";
                                                    IconComponent = Circle;
                                                }
                                            } else {
                                                // Student didn't answer - only show color for correct option
                                                if (isCorrect) {
                                                    textColor = "text-green-600";
                                                }
                                                IconComponent = Circle;
                                            }

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`flex items-center gap-2 p-2 rounded border`}
                                                >
                                                    <span>
                                                        <IconComponent
                                                            className={`h-5 w-5 ${textColor}`}
                                                        />
                                                    </span>
                                                    <span
                                                        className={`flex-1 font-bold ${textColor}`}
                                                    >
                                                        {option.option_text}
                                                        {isCorrect &&
                                                            !isSelected &&
                                                            studentAnswered && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="ml-2 text-green-600"
                                                                >
                                                                    Correct
                                                                </Badge>
                                                            )}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {/* Explanation */}
                                        {answer.question.explanations &&
                                            Object.keys(
                                                answer.question.explanations,
                                            ).length > 0 && (
                                                <div className="pt-4 border-t space-y-2">
                                                    <h4 className="font-semibold text-sm">
                                                        Explanation:
                                                    </h4>
                                                    {Object.entries(
                                                        answer.question
                                                            .explanations,
                                                    ).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md"
                                                        >
                                                            <strong className={cn("text-foreground", {
                                                                "hidden": key === "correct" || key === "wrong"
                                                            })}>
                                                                {key} :
                                                            </strong>
                                                            {value}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {answers.last_page > 1 && (
                    <SmartPagination
                        currentPage={answers.current_page}
                        totalPages={answers.last_page}
                        onPageChange={(page) => {
                            const url = answers.links.find(
                                (link) =>
                                    link.label === String(page) && link.url,
                            )?.url;
                            if (url) handlePageChange(url);
                        }}
                        prevPageUrl={answers.prev_page_url}
                        nextPageUrl={answers.next_page_url}
                        onUrlChange={handlePageChange}
                    />
                )}
            </div>
        </StudentLayout>
    );
}
