import { Head, Link, router } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { route } from "ziggy-js";
import { CheckCircle2, XCircle, Circle } from "lucide-react";
import { SmartPagination } from "@/components/common/SmartPagination";
import { SubjectBadge } from "@/components/common/SubjectBadge";

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
}

interface Answer {
    id: number;
    selected_option_id: number | null;
    is_correct: boolean;
    question: Question;
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
}

export default function AttemptsShow({ attempt, answers }: Props) {
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
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
                                Score: <strong>{attempt.score}</strong>
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

                <div className="space-y-4">
                    {answers.data.map((answer, aIndex) => {
                        const question = answer.question;
                        const selectedId = answer.selected_option_id;

                        return (
                            <Card key={answer.id}>
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        {question.subject && (
                                            <SubjectBadge
                                                subject={question.subject}
                                            />
                                        )}
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

                                        return (
                                            <div
                                                key={option.id}
                                                className="flex items-center gap-2 p-2 rounded border"
                                            >
                                                <span>
                                                    {isCorrect ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : isSelected &&
                                                      !isCorrect ? (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </span>
                                                <span
                                                    className={`flex-1 ${
                                                        isSelected || isCorrect
                                                            ? "font-bold"
                                                            : ""
                                                    } ${
                                                        isCorrect
                                                            ? "text-green-600"
                                                            : isSelected &&
                                                              !isCorrect
                                                            ? "text-red-600"
                                                            : ""
                                                    }`}
                                                >
                                                    {option.option_text}
                                                    {isCorrect ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2 text-green-600"
                                                        >
                                                            Correct
                                                        </Badge>
                                                    ) : null}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {answers.last_page > 1 && (
                    <SmartPagination
                        currentPage={answers.current_page}
                        totalPages={answers.last_page}
                        onPageChange={(page) => {
                            const url = answers.links.find(
                                (link) =>
                                    link.label === String(page) && link.url
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
