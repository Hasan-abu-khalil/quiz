import { Head, Link, router } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { route } from "ziggy-js";
import { Clock, BookOpen, Eye, ArrowLeft } from "lucide-react";
import { SmartPagination } from "@/components/common/SmartPagination";

interface Subject {
    id: number;
    name: string;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    time_limit_minutes: number | null;
    questions: Array<{ id: number }>;
}

interface Props {
    subject: Subject;
    quizzes: {
        data: Quiz[];
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

export default function QuizzesBySubject({ subject, quizzes }: Props) {
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    return (
        <StudentLayout title={`${subject.name} Quizzes`}>
            <Head title={`${subject.name} Quizzes`} />
            <div className="space-y-6">
                <div className="flex justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {subject.name} Quizzes
                        </h1>
                        <p className="text-muted-foreground">
                            Choose a quiz to start.
                        </p>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mb-4"
                        >
                            <Link href={route("student.dashboard")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {quizzes.data.filter((q) => q.questions.length > 0).length ===
                    0 ? (
                    <p className="text-muted-foreground">
                        No quizzes available in this subject.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quizzes.data
                                .filter((quiz) => quiz.questions.length > 0)
                                .map((quiz) => (
                                    <Card
                                        key={quiz.id}
                                        className="flex flex-col"
                                    >
                                        <CardHeader>
                                            <CardTitle>{quiz.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 flex-1 flex flex-col">
                                            <Badge variant="outline">
                                                {quiz.mode
                                                    .split("_")
                                                    .map(
                                                        (word) =>
                                                            word
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            word.slice(1),
                                                    )
                                                    .join(" ")}
                                            </Badge>
                                            {quiz.time_limit_minutes && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    {quiz.time_limit_minutes}{" "}
                                                    min
                                                </div>
                                            )}
                                            <Button
                                                asChild
                                                className="w-full mt-auto"
                                            >
                                                <Link
                                                    href={route(
                                                        "student.quizzes.show",
                                                        quiz.id,
                                                    )}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View & Start
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>

                        {quizzes.last_page > 1 && (
                            <SmartPagination
                                currentPage={quizzes.current_page}
                                totalPages={quizzes.last_page}
                                onPageChange={(page) => {
                                    const url = quizzes.links.find(
                                        (link) =>
                                            link.label === String(page) &&
                                            link.url,
                                    )?.url;
                                    if (url) handlePageChange(url);
                                }}
                                prevPageUrl={quizzes.prev_page_url}
                                nextPageUrl={quizzes.next_page_url}
                                onUrlChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </StudentLayout>
    );
}
