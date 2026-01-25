import * as React from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { handleFormErrors } from "@/lib/utils";
import { route } from "ziggy-js";
import axios from "axios";

interface Subject {
    id: number;
    name: string;
}

interface Question {
    id: number;
    question_text: string;
}

interface QuizQuestion {
    id: number;
    order: number;
    question: Question;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    subject_id?: number;
    time_limit_minutes?: number;
    total_questions?: number;
    questions?: QuizQuestion[];
}

interface Props {
    quiz: Quiz;
    subjects: Subject[];
    questions: Question[];
}

export default function Edit({ quiz, subjects, questions }: Props) {
    const form = useForm({
        title: quiz.title,
        mode: quiz.mode === "timed" ? "mixed_bag" : quiz.mode, // Convert old "timed" to "mixed_bag"
        subject_id: quiz.subject_id ? String(quiz.subject_id) : "",
        total_questions: quiz.total_questions
            ? String(quiz.total_questions)
            : "",
        time_limit_minutes: quiz.time_limit_minutes
            ? String(quiz.time_limit_minutes)
            : "", // إضافة هذا الحقل
        questions: quiz.questions || [],
    });

    const [filteredQuestions, setFilteredQuestions] =
        React.useState<Question[]>(questions);
    const [newQuestionId, setNewQuestionId] = React.useState<string>("");
    const [questionSearch, setQuestionSearch] = React.useState<string>("");

    React.useEffect(() => {
        if (!form.data.subject_id) {
            setFilteredQuestions(questions);
            return;
        }

        fetch(route("admin.questions.bySubject", form.data.subject_id))
            .then((res) => res.json())
            .then((data: Question[]) => {
                setFilteredQuestions(data);
            })
            .catch(() => {
                toast.error("Failed to fetch questions for this subject.");
            });
    }, [form.data.subject_id]);

    const handleAddQuestion = async () => {
        if (!newQuestionId) {
            toast.error("Please select a question");
            return;
        }

        // For mixed_bag mode, check max questions
        if (form.data.mode === "mixed_bag") {
            const max = form.data.total_questions
                ? parseInt(form.data.total_questions, 10)
                : Infinity;
            if ((form.data.questions?.length || 0) >= max) {
                toast.error(
                    `You cannot add more than ${max} questions to this quiz`,
                );
                return;
            }
        }

        try {
            const response = await axios.post(
                `/admin/quizzes/${quiz.id}/questions`,
                {
                    question_id: newQuestionId,
                },
            );

            const addedQuestion = questions.find(
                (q) => q.id === parseInt(newQuestionId),
            );
            if (addedQuestion) {
                form.setData("questions", [
                    ...(form.data.questions || []),
                    {
                        id: response.data.quiz_question_id,
                        order: (form.data.questions?.length || 0) + 1,
                        question: addedQuestion,
                    },
                ]);
                setNewQuestionId("");
                toast.success("Question added successfully");
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.error || "Failed to add question",
            );
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        try {
            await axios.delete(
                `/admin/quizzes/${quiz.id}/questions/${questionId}`,
            );
            form.setData(
                "questions",
                form.data.questions?.filter((q) => q.id !== questionId) || [],
            );
            toast.success("Question deleted successfully");
        } catch (error) {
            toast.error("Failed to delete question");
        }
    };

    const handleUpdateOrder = async (
        quizQuestionId: number,
        newOrder: number,
    ) => {
        try {
            await axios.put(
                `/admin/quizzes/${quiz.id}/questions/${quizQuestionId}/order`,
                {
                    new_order: newOrder,
                },
            );

            const updatedQuestions = (form.data.questions || []).map((q) => {
                if (q.id === quizQuestionId) {
                    return { ...q, order: newOrder };
                }
                if (q.order === newOrder && q.id !== quizQuestionId) {
                    const oldOrder = form.data.questions?.find(
                        (qq) => qq.id === quizQuestionId,
                    )?.order;
                    return { ...q, order: oldOrder ?? q.order };
                }
                return q;
            });

            updatedQuestions.sort((a, b) => a.order - b.order);
            form.setData("questions", updatedQuestions);
            toast.success("Order updated successfully");
        } catch (error) {
            toast.error("Failed to update order");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post(route("admin.quizzes.update", quiz.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Quiz updated successfully");
                router.visit(route("admin.quizzes.index"));
            },
            onError: () => handleFormErrors(form.errors),
        });
    };

    const sortedQuestions = [...(form.data.questions || [])].sort(
        (a, b) => a.order - b.order,
    );

    const filteredSortedQuestions = sortedQuestions.filter((q) => {
        if (!questionSearch.trim()) {
            return true;
        }
        return q.question.question_text
            .toLowerCase()
            .includes(questionSearch.toLowerCase());
    });

    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Quizzes", href: "/admin/quizzes" },
                {
                    title: `Edit: ${quiz.title}`,
                    href: `/admin/quizzes/${quiz.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Quiz: ${quiz.title}`} />
            <div className="p-6">
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href={route("admin.quizzes.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Quizzes
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={form.data.title}
                                        onChange={(e) =>
                                            form.setData(
                                                "title",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.title} />
                                </div>

                                {/* Mode - Radio buttons */}
                                <div className="grid gap-2">
                                    <Label>Mode</Label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="mode"
                                                value="by_subject"
                                                checked={
                                                    form.data.mode ===
                                                    "by_subject"
                                                }
                                                onChange={(e) => {
                                                    form.setData(
                                                        "mode",
                                                        e.target.value,
                                                    );
                                                    // Update total_questions to match current questions length
                                                    form.setData(
                                                        "total_questions",
                                                        String(
                                                            form.data.questions
                                                                ?.length || 0,
                                                        ),
                                                    );
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>By Subject</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="mode"
                                                value="mixed_bag"
                                                checked={
                                                    form.data.mode ===
                                                    "mixed_bag"
                                                }
                                                onChange={(e) => {
                                                    form.setData(
                                                        "mode",
                                                        e.target.value,
                                                    );
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>Randomize</span>
                                        </label>
                                    </div>
                                    <InputError message={form.errors.mode} />
                                </div>

                                {/* Time Limit (Minutes) */}
                                <div className="grid gap-2">
                                    <Label>
                                        Time Limit (Minutes)
                                        <span className="text-muted-foreground text-sm ml-1">
                                            (Optional)
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Enter exam duration in minutes (leave empty for no timer)"
                                        value={form.data.time_limit_minutes}
                                        onChange={(e) =>
                                            form.setData(
                                                "time_limit_minutes",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.time_limit_minutes}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty if you do not want a timer
                                        for this quiz.
                                    </p>
                                </div>

                                {/* Subject */}
                                <div className="grid gap-2">
                                    <Label>Subject</Label>
                                    <Select
                                        value={form.data.subject_id || ""}
                                        onValueChange={(v) =>
                                            form.setData("subject_id", v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s) => (
                                                <SelectItem
                                                    key={s.id}
                                                    value={String(s.id)}
                                                >
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={form.errors.subject_id}
                                    />
                                </div>

                                {/* Total questions - Only show for randomize mode */}
                                {form.data.mode === "mixed_bag" && (
                                    <div className="grid gap-2">
                                        <Label>
                                            Total Questions (to randomly select)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={form.data.total_questions}
                                            onChange={(e) =>
                                                form.setData(
                                                    "total_questions",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter number of questions to randomly select"
                                        />
                                        <InputError
                                            message={
                                                form.errors.total_questions
                                            }
                                        />
                                    </div>
                                )}

                                {/* Show inferred total for by_subject mode */}
                                {form.data.mode === "by_subject" && (
                                    <div className="grid gap-2">
                                        <Label className="text-muted-foreground">
                                            Total Questions (inferred from
                                            selected questions)
                                        </Label>
                                        <p className="text-lg font-semibold">
                                            {form.data.questions?.length || 0}{" "}
                                            question(s)
                                        </p>
                                    </div>
                                )}

                                {/* Quiz Questions */}
                                <div className="border rounded-md p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <Label className="text-md font-semibold">
                                            Quiz Questions (
                                            {sortedQuestions.length})
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={newQuestionId}
                                                onValueChange={setNewQuestionId}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue placeholder="Select question" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredQuestions
                                                        .filter(
                                                            (ques) =>
                                                                !form.data.questions?.some(
                                                                    (q) =>
                                                                        q
                                                                            .question
                                                                            .id ===
                                                                        ques.id,
                                                                ),
                                                        )
                                                        .map((ques) => (
                                                            <SelectItem
                                                                key={ques.id}
                                                                value={String(
                                                                    ques.id,
                                                                )}
                                                            >
                                                                {
                                                                    ques.question_text
                                                                }
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAddQuestion}
                                                disabled={
                                                    !newQuestionId ||
                                                    (form.data.mode ===
                                                        "mixed_bag" &&
                                                    form.data.total_questions
                                                        ? (form.data.questions
                                                              ?.length || 0) >=
                                                          parseInt(
                                                              form.data
                                                                  .total_questions,
                                                              10,
                                                          )
                                                        : false)
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Question
                                            </Button>
                                        </div>
                                    </div>
                                    {sortedQuestions.length > 0 && (
                                        <div className="mb-3">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search questions..."
                                                    value={questionSearch}
                                                    onChange={(e) =>
                                                        setQuestionSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                        {filteredSortedQuestions.map((q) => (
                                            <div
                                                key={q.id}
                                                className="grid grid-cols-[3fr_1fr_auto] gap-3 items-end"
                                            >
                                                <div>
                                                    <Label>Question</Label>
                                                    <p className="text-sm mt-1">
                                                        {
                                                            q.question
                                                                .question_text
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label>Order</Label>
                                                    <Input
                                                        type="number"
                                                        value={q.order}
                                                        onChange={(e) =>
                                                            handleUpdateOrder(
                                                                q.id,
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 1,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteQuestion(
                                                            q.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {sortedQuestions.length === 0 && (
                                            <p className="text-muted-foreground text-center py-4">
                                                No questions added yet
                                            </p>
                                        )}
                                        {sortedQuestions.length > 0 &&
                                            filteredSortedQuestions.length ===
                                                0 && (
                                                <p className="text-muted-foreground text-center py-4">
                                                    No questions match your
                                                    search
                                                </p>
                                            )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(
                                                route("admin.quizzes.index"),
                                            )
                                        }
                                        disabled={form.processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        {form.processing
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
