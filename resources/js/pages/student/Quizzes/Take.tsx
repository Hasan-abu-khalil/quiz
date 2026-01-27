import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { route } from "ziggy-js";
import { Check, ChevronLeft, ChevronRight, DoorOpen, Flag } from "lucide-react";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { TagBadge } from "@/components/common/TagBadge";

interface Props {
    attempt: { id: number };
    question: any;
    questionIndex: string;
    questions: Array<{ id: number }>;
    selectedAnswer?: string;
    isFlagged?: boolean;
    ends_at_timestamp?: number | null;
    explanations?: Record<string, string> | null;
    showExplanationAll?: boolean; // ✅ من backend
}

export default function QuizTake({
    attempt,
    question,
    questionIndex,
    questions,
    selectedAnswer = "",
    isFlagged = false,
    ends_at_timestamp,
    explanations = null,
    showExplanationAll = false,
}: Props) {
    const form = useForm({ answer: selectedAnswer });
    const qIndex = Number(questionIndex);
    const isFirstQuestion = qIndex === 0;
    const isLastQuestion = qIndex === questions.length - 1;
    const allowNavigation = useRef(false);

    const [showExplanation, setShowExplanation] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!ends_at_timestamp) return null;
        const now = Math.floor(Date.now() / 1000);
        const diff = ends_at_timestamp - now;
        return diff > 0 ? diff : 0;
    });

    // تشغيل الشرح مباشرة إذا مفعل من admin
    useEffect(() => {
        if (showExplanationAll) {
            setShowExplanation(true);
        }
    }, [showExplanationAll]);

    // مؤقت الاختبار
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            finishQuiz();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (!prev || prev <= 1) {
                    clearInterval(timer);
                    finishQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const finishQuiz = () => {
        router.post(
            route("student.attempts.submit.single", [attempt.id, qIndex]),
            {},
            {
                onSuccess: () =>
                    router.visit(route("student.attempts.show", attempt.id)),
            },
        );
    };

    // إعادة ضبط السؤال عند تغييره
    useEffect(() => {
        form.reset();
        form.setData("answer", selectedAnswer || "");
        if (!showExplanationAll) setShowExplanation(false);
        setSubmitted(false);
        allowNavigation.current = false;
    }, [question.id]);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.answer) {
            router.visit(route("student.attempts.take.single", [attempt.id, qIndex + 1]));
            return;
        }

        if (!submitted && !showExplanationAll) {
            setSubmitted(true);
            setShowExplanation(true);
            return;
        }

        form.post(
            route("student.attempts.submit.single", [attempt.id, qIndex]),
            {
                onSuccess: () => {
                    router.visit(
                        route("student.attempts.take.single", [attempt.id, qIndex + 1]),
                    );
                },
            },
        );
    };

    const handleFinish = (e: React.FormEvent) => {
        e.preventDefault();

        if (!submitted && !showExplanationAll) {
            setSubmitted(true);
            setShowExplanation(true);

            form.post(
                route("student.attempts.submit.single", [attempt.id, qIndex]),
                { preserveScroll: true },
            );

            return;
        }

        router.visit(route("student.attempts.show", attempt.id));
    };

    const handlePrevious = () => {
        if (qIndex > 0) {
            router.visit(route("student.attempts.take.single", [attempt.id, qIndex - 1]));
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + " hr " : ""}${mins > 0 ? mins + " min " : ""}${secs} sec`;
    };

    return (
        <StudentLayout title="Take Quiz">
            <Head title="Take Quiz" />
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-4">
                    <p className="text-lg font-semibold">
                        Question {qIndex + 1} / {questions.length}
                    </p>
                    <p className="text-sm font-medium text-red-600">
                        Time Left: {timeLeft !== null ? formatTime(timeLeft) : "No time limit"}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col gap-1.5">
                                {question.subject && <SubjectBadge subject={question.subject} />}
                                {question.tags && question.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {question.tags.map((tag: any) => (
                                            <TagBadge key={tag.id} tag={tag} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (isFlagged) {
                                        router.delete(route("student.questions.unflag", question.id), { preserveScroll: true });
                                    } else {
                                        router.post(route("student.questions.flag", question.id), {}, { preserveScroll: true });
                                    }
                                }}
                                className={isFlagged ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                            >
                                <Flag className={`h-5 w-5 ${isFlagged ? "fill-current" : ""}`} />
                            </Button>
                        </div>
                        <CardTitle className="text-xl">{question.question_text}</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <RadioGroup
                                value={form.data.answer}
                                onValueChange={(v) => {
                                    if (submitted && !showExplanationAll) return;
                                    form.setData("answer", v);
                                }}
                                className="space-y-3"
                            >
                                {question.options.map((option: any) => (
                                    <Label
                                        key={option.id}
                                        htmlFor={`option-${option.id}`}
                                        className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer
                                            ${submitted && !showExplanationAll ? "opacity-60 cursor-not-allowed" : "hover:bg-accent"}
                                        `}
                                    >
                                        <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} />
                                        <span className="flex-1">{option.option_text}</span>
                                    </Label>
                                ))}
                            </RadioGroup>

                            {(showExplanation || showExplanationAll) && explanations && (
                                <div className="mt-4 p-4 bg-gray-50 rounded border">
                                    {explanations.correct && (
                                        <p className="text-sm text-green-700">
                                            <strong>Explanation:</strong> {explanations.correct}
                                        </p>
                                    )}

                                    {form.data.answer && explanations[`option${form.data.answer}`] && (
                                        <p className="text-sm text-blue-700 mt-2">
                                            <strong>Selected option:</strong> {explanations[`option${form.data.answer}`]}
                                        </p>
                                    )}

                                    {explanations.wrong && !explanations[`option${form.data.answer}`] && (
                                        <p className="text-sm text-red-700 mt-2">{explanations.wrong}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button type="button" variant="ghost" size="sm" asChild>
                                    <Link href={route("student.dashboard")}>
                                        <DoorOpen className="h-4 w-4" /> Resume Later
                                    </Link>
                                </Button>

                                <div className="flex gap-2 flex-1 justify-end">
                                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={isFirstQuestion}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>

                                    {isLastQuestion ? (
                                        <Button type="button" onClick={handleFinish} disabled={form.processing}>
                                            <Check className="mr-2 h-4 w-4" /> Finish Quiz
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={handleNext} disabled={form.processing}>
                                            {!submitted
                                                ? form.data.answer
                                                    ? "Next"
                                                    : "Skip"
                                                : "Continue"}{" "}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </StudentLayout>
    );
}
