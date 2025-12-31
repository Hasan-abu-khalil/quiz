import { Head, Link, router } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { route } from "ziggy-js";
import { Clock, BookOpen, Trophy, Eye, Play } from "lucide-react";
import { SmartPagination } from "@/components/common/SmartPagination";
import { RelativeDate } from "@/components/common/RelativeDate";

interface Subject {
    id: number;
    name: string;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    time_limit_minutes: number | null;
    total_questions: number | null;
    subject?: {
        id: number;
        name: string;
    } | null;
    questions?: Array<{ id: number }>;
}

interface Attempt {
    id: number;
    score: number | null;
    created_at: string;
    ended_at: string | null;
    quiz: Quiz;
}

interface Props {
    subjects: {
        data: Subject[];
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
    mixedBagQuizzes: Quiz[];
    lastAttempts: Attempt[];
    unfinishedAttempts: Attempt[];
    user: {
        name: string;
    };
}

export default function Dashboard({
    subjects,
    mixedBagQuizzes,
    lastAttempts,
    unfinishedAttempts,
    user,
}: Props) {
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    return (
        <StudentLayout title="Student Dashboard">
            <Head title="Student Dashboard" />
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome, {user.name}
                    </h1>
                    <p className="text-muted-foreground">
                        Choose a subject to see quizzes.
                    </p>
                </div>

                {/* Subjects Section */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Subjects</h2>
                    {subjects.data.length === 0 ? (
                        <p className="text-muted-foreground">
                            No subjects available yet.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {subjects.data.map((subject) => (
                                    <Card
                                        key={subject.id}
                                        className="flex flex-col"
                                    >
                                        <CardHeader>
                                            <CardTitle>
                                                {subject.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="mt-auto">
                                            <Button asChild className="w-full">
                                                <Link
                                                    href={route(
                                                        "student.subject.quizzes",
                                                        subject.id
                                                    )}
                                                >
                                                    View Quizzes
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {subjects.last_page > 1 && (
                                <SmartPagination
                                    currentPage={subjects.current_page}
                                    totalPages={subjects.last_page}
                                    onPageChange={(page) => {
                                        const url = subjects.links.find(
                                            (link) =>
                                                link.label === String(page) &&
                                                link.url
                                        )?.url;
                                        if (url) handlePageChange(url);
                                    }}
                                    prevPageUrl={subjects.prev_page_url}
                                    nextPageUrl={subjects.next_page_url}
                                    onUrlChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Mixed Bag Quizzes Section */}
                {mixedBagQuizzes.length > 0 && (
                    <>
                        <div className="border-t pt-8">
                            <h2 className="text-2xl font-semibold mb-2">
                                Mixed Bag Quizzes
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Take randomized quizzes with questions from
                                multiple subjects to test your knowledge across
                                different topics.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mixedBagQuizzes
                                    .filter(
                                        (quiz) =>
                                            (quiz.questions?.length ?? 0) > 0
                                    )
                                    .map((quiz) => (
                                        <Card
                                            key={quiz.id}
                                            className="flex flex-col"
                                        >
                                            <CardHeader>
                                                <CardTitle>
                                                    {quiz.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2 flex-1 flex flex-col">
                                                <div className="space-y-1">
                                                    <Badge variant="outline">
                                                        {quiz.mode
                                                            .split("_")
                                                            .map(
                                                                (word) =>
                                                                    word
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                    word.slice(
                                                                        1
                                                                    )
                                                            )
                                                            .join(" ")}
                                                    </Badge>
                                                    {quiz.time_limit_minutes && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            {
                                                                quiz.time_limit_minutes
                                                            }{" "}
                                                            min
                                                        </div>
                                                    )}
                                                    {quiz.total_questions && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <BookOpen className="h-4 w-4" />
                                                            {
                                                                quiz.total_questions
                                                            }{" "}
                                                            questions
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    asChild
                                                    className="w-full mt-auto"
                                                >
                                                    <Link
                                                        href={route(
                                                            "student.quizzes.show",
                                                            quiz.id
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
                        </div>
                    </>
                )}

                {/* Adaptive Quiz Section */}
                <div className="border-t pt-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        Adaptive Quizzes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>Create Challenge</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground mb-4">
                                    Generate a personalized adaptive quiz based
                                    on your performance
                                </p>
                                <Button asChild className="w-full mt-auto">
                                    <Link
                                        href={route("student.adaptive.create")}
                                    >
                                        Create Challenge
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>Browse Challenges</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground mb-4">
                                    Take adaptive quizzes created by other
                                    students
                                </p>
                                <Button asChild className="w-full mt-auto">
                                    <Link
                                        href={route("student.adaptive.index")}
                                    >
                                        Browse Challenges
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>My Challenges</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground mb-4">
                                    View and manage your created adaptive
                                    quizzes
                                </p>
                                <Button asChild className="w-full mt-auto">
                                    <Link
                                        href={route(
                                            "student.adaptive.myChallenges"
                                        )}
                                    >
                                        My Challenges
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Unfinished Quizzes Section */}
                {unfinishedAttempts.length > 0 && (
                    <div className="border-t pt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">
                                Unfinished Quizzes
                            </h2>
                            <Button variant="outline" asChild>
                                <Link href={route("student.attempts.index")}>
                                    View all attempts
                                </Link>
                            </Button>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Continue where you left off
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unfinishedAttempts.map((attempt) => (
                                <Card
                                    key={attempt.id}
                                    className="flex flex-col border-orange-200 dark:border-orange-800"
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            {attempt.quiz.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                Started:{" "}
                                                <RelativeDate
                                                    date={attempt.created_at}
                                                />
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-auto">
                                            <Button
                                                asChild
                                                variant="default"
                                                size="sm"
                                                className="flex-1"
                                            >
                                                <Link
                                                    href={route(
                                                        "student.attempts.resume",
                                                        attempt.id
                                                    )}
                                                >
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Resume
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Attempts Section */}
                <div className="border-t pt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">
                            Your Recent Attempts
                        </h2>
                        <Button variant="outline" asChild>
                            <Link href={route("student.attempts.index")}>
                                View all attempts
                            </Link>
                        </Button>
                    </div>
                    {lastAttempts.length === 0 ? (
                        <p className="text-muted-foreground">
                            You have no recent attempts.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lastAttempts.map((attempt) => (
                                <Card
                                    key={attempt.id}
                                    className="flex flex-col"
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            {attempt.quiz.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Score: {attempt.score ?? 0} /{" "}
                                                {attempt.quiz.questions
                                                    ?.length ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Attempted:{" "}
                                            <RelativeDate
                                                date={attempt.created_at}
                                            />
                                        </p>
                                        <div className="flex gap-2 mt-auto">
                                            <Button
                                                asChild
                                                variant="default"
                                                size="sm"
                                                className="flex-1"
                                            >
                                                <Link
                                                    href={route(
                                                        "student.attempts.show",
                                                        attempt.id
                                                    )}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>
                                            {!attempt.ended_at && (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <Link
                                                        href={route(
                                                            "student.attempts.resume",
                                                            attempt.id
                                                        )}
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Resume
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
