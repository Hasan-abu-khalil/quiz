import { Head, Link, router, useForm } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { route } from "ziggy-js";
import { Check, ChevronLeft, ChevronRight, DoorOpen, X } from "lucide-react";
import { SubjectBadge } from "@/components/common/SubjectBadge";

interface Subject {
    id: number;
    name: string;
}

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    subject: Subject | null;
    options: Option[];
}

interface Attempt {
    id: number;
}

interface Props {
    attempt: Attempt;
    question: Question;
    questionIndex: number;
    questions: Array<{ id: number }>;
    selectedAnswer?: string;
}

export default function QuizTake({
    attempt,
    question,
    questionIndex,
    questions,
    selectedAnswer = "",
}: Props) {
    const form = useForm({
        answer: selectedAnswer,
    });

    const isFirstQuestion = questionIndex === 0;
    const isLastQuestion = questionIndex === questions.length - 1;

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.answer) return;

        form.post(
            route("student.attempts.submit.single", [attempt.id, questionIndex])
        );
    };

    const handleFinish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.answer) return;

        form.post(
            route("student.attempts.submit.single", [attempt.id, questionIndex])
        );
    };

    const handlePrevious = () => {
        if (questionIndex > 0) {
            router.visit(
                route("student.attempts.take.single", [
                    attempt.id,
                    questionIndex - 1,
                ])
            );
        }
    };

    return (
        <StudentLayout title="Take Quiz">
            <Head title="Take Quiz" />
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                    <p className="text-lg font-semibold">
                        Question {questionIndex + 1} / {questions.length}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        {question.subject && (
                            <div className="mb-2">
                                <SubjectBadge subject={question.subject} />
                            </div>
                        )}
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
                                                !form.data.answer ||
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
                                                !form.data.answer ||
                                                form.processing
                                            }
                                        >
                                            Next
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
