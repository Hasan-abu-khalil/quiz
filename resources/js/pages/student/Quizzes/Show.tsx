import { Head, Link, useForm } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { route } from "ziggy-js";
import { Clock, BookOpen, ArrowLeft, Play } from "lucide-react";
import { SubjectBadge } from "@/components/common/SubjectBadge";

interface Subject {
    id: number;
    name: string;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    time_limit_minutes: number | null;
    subject: Subject | null;
    questions: Array<{ id: number }>;
}

interface Props {
    quiz: Quiz;
}

export default function QuizShow({ quiz }: Props) {
    const form = useForm({});

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route("student.quizzes.start", quiz.id));
    };

    return (
        <StudentLayout title={quiz.title}>
            <Head title={quiz.title} />
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {quiz.subject && (
                            <div>
                                <SubjectBadge subject={quiz.subject} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    {quiz.mode
                                        .split("_")
                                        .map(
                                            (word) =>
                                                word.charAt(0).toUpperCase() +
                                                word.slice(1)
                                        )
                                        .join(" ")}
                                </Badge>
                            </div>

                            {quiz.time_limit_minutes && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        Time limit: {quiz.time_limit_minutes}{" "}
                                        minutes
                                    </span>
                                </div>
                            )}

                            {quiz.questions.length > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <BookOpen className="h-4 w-4" />
                                    <span>
                                        Questions: {quiz.questions.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleStart} className="space-y-4">
                            <Button type="submit" className="w-full" size="lg">
                                <Play className="mr-2 h-5 w-5" />
                                Start Quiz
                            </Button>
                        </form>

                        <Button variant="outline" asChild className="w-full">
                            <Link href={route("student.dashboard")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to dashboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </StudentLayout>
    );
}
