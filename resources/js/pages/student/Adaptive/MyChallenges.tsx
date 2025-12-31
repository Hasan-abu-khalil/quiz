import * as React from "react";
import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartPagination } from "@/components/common/SmartPagination";
import { RelativeDate } from "@/components/common/RelativeDate";
import { ArrowLeft, Trophy, Users, BookOpen, Clock, BarChart3 } from "lucide-react";
import { route } from "ziggy-js";

interface Quiz {
    id: number;
    title: string;
    total_questions: number;
    time_limit_minutes: number | null;
    created_at: string;
    subject: {
        id: number;
        name: string;
    } | null;
    strategy: string;
    subject_ids: number[] | null;
    attempt_count: number;
    best_score: number | null;
}

interface Props {
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
    strategies: Record<string, string>;
}

const strategyColors: Record<string, string> = {
    worst_performing: "bg-red-100 text-red-800",
    never_attempted: "bg-blue-100 text-blue-800",
    recently_incorrect: "bg-orange-100 text-orange-800",
    weak_subjects: "bg-purple-100 text-purple-800",
    mixed: "bg-green-100 text-green-800",
};


export default function MyChallenges({ quizzes, strategies }: Props) {
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const getStrategyColor = (strategyKey: string) => {
        return strategyColors[strategyKey] || "bg-gray-100 text-gray-800";
    };

    const getPercentage = (score: number, total: number) => {
        return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    return (
        <>
            <Head title="My Challenges" />
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                router.visit(route("student.dashboard"))
                            }
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold">My Challenges</h1>
                        <p className="text-muted-foreground mt-2">
                            Adaptive quizzes you've created
                        </p>
                    </div>
                    <Button
                        onClick={() =>
                            router.visit(route("student.adaptive.create"))
                        }
                    >
                        Create New Challenge
                    </Button>
                </div>

                {quizzes.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground mb-4">
                                You haven't created any adaptive quizzes yet.
                            </p>
                            <Button
                                onClick={() =>
                                    router.visit(
                                        route("student.adaptive.create")
                                    )
                                }
                            >
                                Create Your First Challenge
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {quizzes.data.map((quiz) => (
                                <Card
                                    key={quiz.id}
                                    className="hover:shadow-lg transition-shadow"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg flex-1">
                                                {quiz.title}
                                            </CardTitle>
                                            <Badge
                                                className={getStrategyColor(
                                                    quiz.strategy
                                                )}
                                            >
                                                {strategies[quiz.strategy] ||
                                                    quiz.strategy}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Created{" "}
                                            <RelativeDate
                                                date={quiz.created_at}
                                            />
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {quiz.subject && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                    {quiz.subject.name}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {quiz.total_questions}{" "}
                                                    questions
                                                </span>
                                                {quiz.time_limit_minutes && (
                                                    <span className="flex items-center text-muted-foreground">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {quiz.time_limit_minutes}{" "}
                                                        min
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Users className="mr-2 h-4 w-4" />
                                                {quiz.attempt_count}{" "}
                                                {quiz.attempt_count === 1
                                                    ? "attempt"
                                                    : "attempts"}
                                            </div>

                                            {quiz.best_score !== null && (
                                                <div className="flex items-center text-sm">
                                                    <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                                                    <span className="font-medium">
                                                        Best Score:{" "}
                                                        {quiz.best_score} /{" "}
                                                        {quiz.total_questions} (
                                                        {getPercentage(
                                                            quiz.best_score,
                                                            quiz.total_questions
                                                        )}
                                                        %)
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex space-x-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "student.quizzes.show",
                                                                quiz.id
                                                            )
                                                        )
                                                    }
                                                >
                                                    View Quiz
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "student.quizzes.leaderboard",
                                                                quiz.id
                                                            )
                                                        )
                                                    }
                                                >
                                                    <BarChart3 className="mr-2 h-4 w-4" />
                                                    Leaderboard
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <SmartPagination
                            currentPage={quizzes.current_page}
                            totalPages={quizzes.last_page}
                            onPageChange={(page) => {
                                const url = quizzes.links.find(
                                    (link) =>
                                        link.label === String(page) && link.url
                                )?.url;
                                if (url) handlePageChange(url);
                            }}
                            prevPageUrl={quizzes.prev_page_url}
                            nextPageUrl={quizzes.next_page_url}
                            onUrlChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </>
    );
}



