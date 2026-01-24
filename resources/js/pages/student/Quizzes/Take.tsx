import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect } from "react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { route } from "ziggy-js";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    DoorOpen,
    X,
    Flag,
} from "lucide-react";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { TagBadge } from "@/components/common/TagBadge";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    subject: Subject | null;
    tags?: Tag[];
    options: Option[];
}

interface Attempt {
    id: number;
}

interface Props {
    attempt: Attempt;
    question: Question;
    questionIndex: string;
    questions: Array<{ id: number }>;
    selectedAnswer?: string;
    isFlagged?: boolean;
}

export default function QuizTake({
    attempt,
    question,
    questionIndex,
    questions,
    selectedAnswer = "",
    isFlagged = false,
}: Props) {
    const form = useForm({
        answer: selectedAnswer,
    });

    const qIndex = Number(questionIndex);
    const isFirstQuestion = qIndex === 0;
    const isLastQuestion = qIndex === questions.length - 1;

    // Reset form when question changes - Inertia-native approach
    // Using useEffect ensures form resets when question.id changes (new question loaded)
    useEffect(() => {
        form.reset();
        form.setData("answer", selectedAnswer || "");
    }, [question.id]); // Reset when question ID changes

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        const currentAnswer = form.data.answer;
        if (!currentAnswer || currentAnswer === "") {
            router.visit(
                route("student.attempts.take.single", [attempt.id, qIndex + 1])
            );
            return;
        }

        form.post(
            route("student.attempts.submit.single", [attempt.id, qIndex])
        );
    };

    const handleFinish = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.answer) {
            router.visit(
                route("student.attempts.take.single", [attempt.id, qIndex + 1])
            );
            return;
        }

        form.post(
            route("student.attempts.submit.single", [attempt.id, qIndex])
        );
    };

    const handlePrevious = () => {
        if (qIndex > 0) {
            router.visit(
                route("student.attempts.take.single", [attempt.id, qIndex - 1])
            );
        }
    };

    return (
        <StudentLayout title="Take Quiz">
            <Head title="Take Quiz" />
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-lg font-semibold">
                        Question {qIndex + 1} / {questions.length}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col gap-1.5">
                                {question.subject && (
                                    <SubjectBadge subject={question.subject} />
                                )}
                                {question.tags && question.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {question.tags.map((tag) => (
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
                                        router.delete(
                                            route(
                                                "student.questions.unflag",
                                                question.id
                                            ),
                                            { preserveScroll: true }
                                        );
                                    } else {
                                        router.post(
                                            route(
                                                "student.questions.flag",
                                                question.id
                                            ),
                                            {},
                                            { preserveScroll: true }
                                        );
                                    }
                                }}
                                className={
                                    isFlagged
                                        ? "text-yellow-500 hover:text-yellow-600"
                                        : "text-muted-foreground hover:text-yellow-500"
                                }
                            >
                                <Flag
                                    className={`h-5 w-5 ${isFlagged ? "fill-current" : ""}`}
                                />
                            </Button>
                        </div>
                        <CardTitle className="text-xl">
                            {question.question_text}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <RadioGroup
                                value={form.data.answer}
                                onValueChange={(value) =>
                                    form.setData("answer", value)
                                }
                                className="space-y-3"
                            >
                                {question.options.map((option) => (
                                    <Label
                                        key={option.id}
                                        htmlFor={`option-${option.id}`}
                                        className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                    >
                                        <RadioGroupItem
                                            value={String(option.id)}
                                            id={`option-${option.id}`}
                                        />
                                        <span className="flex-1">
                                            {option.option_text}
                                        </span>
                                    </Label>
                                ))}
                            </RadioGroup>

                            <div className="flex items-center justify-between gap-4 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={route("student.dashboard")}>
                                        <DoorOpen className="h-4 w-4" /> Resume
                                        Later
                                    </Link>
                                </Button>

                                <div className="flex gap-2 flex-1 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={isFirstQuestion}
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>

                                    {isLastQuestion ? (
                                        <Button
                                            type="button"
                                            onClick={handleFinish}
                                            disabled={

                                                form.processing
                                            }
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Finish Quiz
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={
                                                form.processing
                                            }
                                        >
                                            {form.data.answer ? "Next" : "Skip"}
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
