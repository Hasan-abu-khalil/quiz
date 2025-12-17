import * as React from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import axios from "axios";
import { DialogTrigger } from "@radix-ui/react-dialog";

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

interface EditQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quiz: Quiz | null;
    subjects: Subject[];
    allQuestions: Question[]; // all available questions for editing
}

export function EditQuizDialog({
    open,
    onOpenChange,
    quiz,
    subjects,
    allQuestions,
}: EditQuizDialogProps) {
    const form = useForm({
        title: quiz?.title || "",
        mode: quiz?.mode || "by_subject",
        subject_id: quiz?.subject_id ? String(quiz.subject_id) : "",
        time_limit_minutes: quiz?.time_limit_minutes
            ? String(quiz.time_limit_minutes)
            : "",
        total_questions: quiz?.total_questions
            ? String(quiz.total_questions)
            : "",
        questions: quiz?.questions || [],
    });

    React.useEffect(() => {
        if (quiz) {
            form.setData({
                title: quiz.title,
                mode: quiz.mode,
                subject_id: quiz.subject_id ? String(quiz.subject_id) : "",
                time_limit_minutes: quiz.time_limit_minutes
                    ? String(quiz.time_limit_minutes)
                    : "",
                total_questions: quiz.total_questions
                    ? String(quiz.total_questions)
                    : "",
                questions: quiz.questions || [],
            });
        }
    }, [quiz]);

    const maxQuestions = form.data.total_questions
        ? parseInt(form.data.total_questions, 10)
        : Infinity;

    const canAddQuestion = (form.data.questions?.length || 0) < maxQuestions;

    const canSubmit =
        form.data.total_questions && form.data.questions
            ? form.data.questions.length ===
              parseInt(form.data.total_questions, 10)
            : true;
            
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quiz) return;

        form.post(route("admin.quizzes.update", quiz.id), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.clearErrors();
                toast.success("Quiz updated successfully");
            },
            onError: () => toast.error("Please fix the errors in the form"),
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen && quiz) {
            form.setData({
                title: quiz.title,
                mode: quiz.mode,
                subject_id: quiz.subject_id ? String(quiz.subject_id) : "",
                time_limit_minutes: quiz.time_limit_minutes
                    ? String(quiz.time_limit_minutes)
                    : "",
                total_questions: quiz.total_questions
                    ? String(quiz.total_questions)
                    : "",
                questions: quiz.questions || [],
            });
            form.clearErrors();
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!quiz) return;

        try {
            await axios.delete(
                `/admin/quizzes/${quiz.id}/questions/${questionId}`
            );
            toast.success("Question deleted successfully");

            // remove from local state
            form.setData(
                "questions",
                form.data.questions?.filter((q) => q.id !== questionId)
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete question");
        }
    };

    const handleEditQuestion = async (
        quizQuestionId: number,
        newQuestionId: number
    ) => {
        if (!quiz) return;

        try {
            await axios.put(
                `/admin/quizzes/${quiz.id}/questions/${quizQuestionId}`,
                { question_id: newQuestionId } // must match backend validation
            );

            toast.success("Question updated successfully");

            // update local state
            form.setData(
                "questions",
                form.data.questions?.map((q) =>
                    q.id === quizQuestionId
                        ? {
                              ...q,
                              question: allQuestions.find(
                                  (question) => question.id === newQuestionId
                              )!,
                          }
                        : q
                )
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to update question");
        }
    };

    const handleEditOrder = async (
        quizQuestionId: number,
        newOrder: number
    ) => {
        if (!quiz) return;

        try {
            // Update backend
            await axios.put(
                `/admin/quizzes/${quiz.id}/questions/${quizQuestionId}/order`,
                {
                    new_order: newOrder,
                }
            );

            // Update local state
            const updatedQuestions = (form.data.questions || []).map((q) => {
                if (q.id === quizQuestionId) {
                    return { ...q, order: newOrder };
                }

                // If another question has the same order, swap it with the current
                if (q.order === newOrder && q.id !== quizQuestionId) {
                    const oldOrder = form.data.questions.find(
                        (qq) => qq.id === quizQuestionId
                    )?.order;
                    return { ...q, order: oldOrder ?? q.order };
                }

                return q;
            });

            // Sort questions by order so the UI updates properly
            updatedQuestions.sort((a, b) => a.order - b.order);

            form.setData("questions", updatedQuestions);

            toast.success("Order updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update order");
        }
    };

    const [editingQuestionId, setEditingQuestionId] = React.useState<
        number | null
    >(null);

    const [newQuestionId, setNewQuestionId] = React.useState<number | null>(
        null
    );
    const [filteredQuestions, setFilteredQuestions] =
        React.useState<Question[]>(allQuestions);

    React.useEffect(() => {
        if (!form.data.subject_id) {
            setFilteredQuestions(allQuestions);
            return;
        }

        axios
            .get(`/admin/questions/by-subject/${form.data.subject_id}`)
            .then((res) => {
                setFilteredQuestions(res.data);
            })
            .catch(() => {
                toast.error("Failed to load questions for selected subject");
            });
    }, [form.data.subject_id]);

    const handleAddQuestion = async () => {
        if (!quiz || !newQuestionId) return;

        const max = form.data.total_questions
            ? parseInt(form.data.total_questions, 10)
            : Infinity;

        if ((form.data.questions?.length || 0) >= max) {
            toast.error(
                `You cannot add more than ${max} questions to this quiz`
            );
            return;
        }

        try {
            // Send request to backend to create QuizQuestion
            const response = await axios.post(
                `/admin/quizzes/${quiz.id}/questions`,
                { question_id: newQuestionId }
            );

            // Update local state
            const addedQuestion = allQuestions.find(
                (q) => q.id === newQuestionId
            );
            if (addedQuestion) {
                form.setData("questions", [
                    ...(form.data.questions || []),
                    {
                        id: response.data.quiz_question_id,
                        order: form.data.questions?.length + 1,
                        question: addedQuestion,
                    },
                ]);
            }

            toast.success("Question added successfully");
            setNewQuestionId(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add question");
        }
    };

    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5; // number of questions per page

    const totalPages = form.data.questions
        ? Math.ceil(form.data.questions.length / itemsPerPage)
        : 1;

    const paginatedQuestions = form.data.questions
        ? form.data.questions.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
          )
        : [];

    if (!quiz) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Quiz</DialogTitle>
                        <DialogDescription>
                            Update quiz information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 max-h-64 overflow-y-auto">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData("title", e.target.value)
                                }
                                required
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="mode">Mode</Label>
                            <Select
                                value={form.data.mode}
                                onValueChange={(value) =>
                                    form.setData("mode", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="by_subject">
                                        By Subject
                                    </SelectItem>
                                    <SelectItem value="mixed_bag">
                                        Mixed Bag
                                    </SelectItem>
                                    <SelectItem value="timed">Timed</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.mode} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="subject_id">
                                Subject (Optional)
                            </Label>
                            <Select
                                value={form.data.subject_id || "none"}
                                onValueChange={(value) =>
                                    form.setData(
                                        "subject_id",
                                        value === "none" ? "" : value
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {subjects.map((subject) => (
                                        <SelectItem
                                            key={subject.id}
                                            value={String(subject.id)}
                                        >
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.subject_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="time_limit_minutes">
                                Time Limit (minutes, optional)
                            </Label>
                            <Input
                                id="time_limit_minutes"
                                type="number"
                                min="1"
                                value={form.data.time_limit_minutes}
                                onChange={(e) =>
                                    form.setData(
                                        "time_limit_minutes",
                                        e.target.value
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.time_limit_minutes}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="total_questions">
                                Total Questions (optional)
                            </Label>
                            <Input
                                id="total_questions"
                                type="number"
                                min="1"
                                value={form.data.total_questions}
                                onChange={(e) =>
                                    form.setData(
                                        "total_questions",
                                        e.target.value
                                    )
                                }
                            />
                            <InputError message={form.errors.total_questions} />
                        </div>
                    </div>

                    <DialogFooter>
                        {!canSubmit && (
                            <p className="text-sm text-red-600">
                                You must add exactly {form.data.total_questions}{" "}
                                questions before updating the quiz.
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || !canSubmit}
                            >
                                {form.processing
                                    ? "Updating..."
                                    : "Update Quiz"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>

                <div className="mt-6 grid gap-2">
                    <Label htmlFor="new_question">Add New Question</Label>
                    <div className="flex gap-2">
                        <Select
                            value={newQuestionId ? String(newQuestionId) : ""}
                            onValueChange={(value) =>
                                setNewQuestionId(Number(value))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select question" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredQuestions
                                    .filter(
                                        (question) =>
                                            !form.data.questions
                                                ?.map((q) => q.question.id)
                                                .includes(question.id)
                                    )
                                    .map((question) => (
                                        <SelectItem
                                            key={question.id}
                                            value={String(question.id)}
                                        >
                                            {question.question_text}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            onClick={handleAddQuestion}
                            disabled={!newQuestionId || !canAddQuestion}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* Questions Table */}
                {form.data.questions && form.data.questions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold mb-2">Questions</h3>
                        <div className="border border-gray-200 max-h-64 overflow-y-auto">
                            <table className="w-full border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">Question</th>
                                        <th className="p-2 border">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuestions.map((q) => (
                                        <tr
                                            key={q.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="p-2 border">
                                                {q.question.question_text}
                                            </td>

                                            {/* Order editing */}
                                            <td className="p-2 border flex gap-2 items-center">
                                                <Select
                                                    value={String(q.order)}
                                                    onValueChange={(value) =>
                                                        handleEditOrder(
                                                            q.id,
                                                            Number(value)
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select order" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            {
                                                                length: form
                                                                    .data
                                                                    .questions
                                                                    .length,
                                                            },
                                                            (_, i) => i + 1
                                                        ).map((num) => (
                                                            <SelectItem
                                                                key={num}
                                                                value={String(
                                                                    num
                                                                )}
                                                            >
                                                                {num}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* Edit button for question text (optional) */}
                                                {editingQuestionId === q.id ? (
                                                    <Select
                                                        value={String(
                                                            q.question.id
                                                        )}
                                                        onValueChange={(
                                                            newQuestionId
                                                        ) => {
                                                            handleEditQuestion(
                                                                q.id,
                                                                Number(
                                                                    newQuestionId
                                                                )
                                                            );
                                                            setEditingQuestionId(
                                                                null
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select question" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {filteredQuestions
                                                                .filter(
                                                                    (
                                                                        question
                                                                    ) =>
                                                                        !form.data.questions
                                                                            ?.map(
                                                                                (
                                                                                    qq
                                                                                ) =>
                                                                                    qq
                                                                                        .question
                                                                                        .id
                                                                            )
                                                                            .includes(
                                                                                question.id
                                                                            ) ||
                                                                        question.id ===
                                                                            q
                                                                                .question
                                                                                .id
                                                                )
                                                                .map(
                                                                    (
                                                                        question
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                question.id
                                                                            }
                                                                            value={String(
                                                                                question.id
                                                                            )}
                                                                        >
                                                                            {
                                                                                question.question_text
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <button
                                                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                                        onClick={() =>
                                                            setEditingQuestionId(
                                                                q.id
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                <button
                                                    className="text-red-500 px-2 py-1 border rounded hover:bg-red-100"
                                                    onClick={() =>
                                                        handleDeleteQuestion(
                                                            q.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-center mt-4">
                                <div className="flex items-center space-x-1">
                                    {/* Prev */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(prev - 1, 1)
                                            )
                                        }
                                    >
                                        Prev
                                    </Button>

                                    {/* Page Numbers */}
                                    {(() => {
                                        const pages = [];
                                        const total = totalPages;
                                        const current = currentPage;
                                        const maxVisible = 5;

                                        // Always show page 1
                                        pages.push(1);

                                        // Sliding window range
                                        let start = Math.max(2, current - 2);
                                        let end = Math.min(
                                            total - 1,
                                            current + 2
                                        );

                                        if (current <= 3) {
                                            end = Math.min(6, total - 1);
                                        }

                                        if (current >= total - 2) {
                                            start = Math.max(2, total - 5);
                                        }

                                        // Ellipsis after page 1
                                        if (start > 2) pages.push("...");

                                        // Middle pages
                                        for (let i = start; i <= end; i++)
                                            pages.push(i);

                                        // Ellipsis before last page
                                        if (end < total - 1) pages.push("...");

                                        // Always show last page
                                        if (total > 1) pages.push(total);

                                        return pages.map((page, index) =>
                                            page === "..." ? (
                                                <span
                                                    key={index}
                                                    className="px-2"
                                                >
                                                    ...
                                                </span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            page as number
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded border text-sm ${
                                                        currentPage === page
                                                            ? "bg-blue-600 text-white"
                                                            : "hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        );
                                    })()}

                                    {/* Next */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(prev + 1, totalPages)
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
