import * as React from "react";
import { useForm } from "@inertiajs/react";
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
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";

interface Subject {
    id: number;
    name: string;
}

interface Question {
    id: number;
    question_text: string;
}

interface CreateQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjects: Subject[];
    questions: Question[] | undefined; // important fix
}

export function CreateQuizDialog({
    open,
    onOpenChange,
    subjects,
    questions = [], // fallback fix
}: CreateQuizDialogProps) {
    const form = useForm({
        title: "",
        mode: "by_subject",
        subject_id: "",
        time_limit_minutes: "",
        total_questions: "",
        questions: [],
    });

    const addRow = () => {
        const total = parseInt(form.data.total_questions, 10);
        if (!total || form.data.questions.length >= total) {
            toast.error(`You cannot add more than ${total || 0} questions`);
            return;
        }

        form.setData("questions", [
            ...form.data.questions,
            { question_id: "", order: form.data.questions.length + 1 },
        ]);
    };

    const removeRow = (index: number) => {
        const updated = [...form.data.questions];
        updated.splice(index, 1);
        form.setData("questions", updated);
    };

    const updateRow = (index: number, field: string, value: string) => {
        const updated = [...form.data.questions];
        updated[index][field] = value;
        form.setData("questions", updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.subject_id) {
            toast.error("Please select a subject");
            return;
        }

        const incomplete = form.data.questions.some((q) => !q.question_id);
        if (incomplete) {
            toast.error("Please select a question for all rows");
            return;
        }
        const total = parseInt(form.data.total_questions, 10);
        if (form.data.questions.length !== total) {
            toast.error(
                `Total questions do not match the number of questions added. Added: ${form.data.questions.length}, Expected: ${total}`
            );
            return;
        }

        form.post(route("admin.quizzes.create"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Quiz created");
                form.reset();
                onOpenChange(false);
            },
            onError: () => toast.error("Fix the errors"),
        });
    };

    const [filteredQuestions, setFilteredQuestions] =
        React.useState<Question[]>(questions);
    React.useEffect(() => {
        const total = parseInt(form.data.total_questions, 10);
        if (!form.data.subject_id || !total) {
            setFilteredQuestions(questions);
            form.setData("questions", []);
            return;
        }

        fetch(route("admin.questions.bySubject", form.data.subject_id))
        .then((res) => res.json())
        .then((data: Question[]) => {
            if (!data.length) {
                toast.error(
                    "This subject has no questions. Please go to the Questions section and assign questions first."
                );
                setFilteredQuestions([]);
                form.setData("questions", []);
                return;
            }

            setFilteredQuestions(data);

            // Automatically populate question rows up to the total_questions
            const rows = Array.from({ length: total }, (_, i) => ({
                question_id: "",
                order: i + 1,
            }));
            form.setData("questions", rows);
        })
        .catch(() => {
            toast.error("Failed to fetch questions for this subject.");
        });
}, [form.data.subject_id, form.data.total_questions]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Add New Quiz"
            description="Create a new quiz and add questions"
            submitButtonText="Create Quiz"
            onSubmit={handleSubmit}
            isProcessing={form.processing}
            closeOnInteractOutside={false}
        >
            <div className="max-h-96 overflow-y-auto">
                {/* Title */}
                <div className="grid gap-2 mb-4">
                    <Label>Title</Label>
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData("title", e.target.value)}
                    />
                    <InputError message={form.errors.title} />
                </div>

                {/* Mode */}
                <div className="grid gap-2 mb-4">
                    <Label>Mode</Label>
                    <Select
                        value={form.data.mode}
                        onValueChange={(v) => form.setData("mode", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="by_subject">
                                By Subject
                            </SelectItem>
                            <SelectItem value="mixed_bag">Mixed Bag</SelectItem>
                            <SelectItem value="timed">Timed</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.mode} />
                </div>

                {/* Subject */}
                <div className="grid gap-2 mb-4">
                    <Label>Subject</Label>
                    <Select
                        value={form.data.subject_id || ""}
                        onValueChange={(v) => form.setData("subject_id", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.subject_id} />
                </div>

                {/* Time limit */}
                <div className="grid gap-2 mb-4">
                    <Label>Time Limit (minutes)</Label>
                    <Input
                        type="number"
                        value={form.data.time_limit_minutes}
                        onChange={(e) =>
                            form.setData("time_limit_minutes", e.target.value)
                        }
                    />
                    <InputError message={form.errors.time_limit_minutes} />
                </div>

                {/* Total questions */}
                <div className="grid gap-2 mb-4">
                    <Label>Total Questions</Label>
                    <Input
                        type="number"
                        value={form.data.total_questions}
                        onChange={(e) =>
                            form.setData("total_questions", e.target.value)
                        }
                    />
                    <InputError message={form.errors.total_questions} />
                </div>

                {/* Quiz Questions */}
                <div className="border rounded-md p-4 mt-3">
                    <div className="flex justify-between items-center mb-3">
                        <Label className="text-md font-semibold">
                            Quiz Questions
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            onClick={addRow}
                            disabled={
                                !form.data.total_questions ||
                                form.data.questions.length >=
                                    parseInt(form.data.total_questions, 10)
                            }
                        >
                            + Add Question
                        </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {form.data.questions.map((q, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-5 gap-3 mb-3 items-end"
                            >
                                <div className="col-span-3">
                                    <Label>Question</Label>
                                    <Select
                                        value={q.question_id}
                                        onValueChange={(v) =>
                                            updateRow(index, "question_id", v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select question" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {filteredQuestions
                                                .filter(
                                                    (ques) =>
                                                        !form.data.questions.some(
                                                            (q2, idx) =>
                                                                q2.question_id ===
                                                                    String(
                                                                        ques.id
                                                                    ) &&
                                                                idx !== index
                                                        )
                                                )
                                                .map((ques) => (
                                                    <SelectItem
                                                        key={ques.id}
                                                        value={String(ques.id)}
                                                    >
                                                        {ques.question_text}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>

                                    <InputError
                                        message={
                                            form.errors[
                                                `questions.${index}.question_id`
                                            ]
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Order</Label>
                                    <Input
                                        type="number"
                                        value={q.order}
                                        onChange={(e) =>
                                            updateRow(
                                                index,
                                                "order",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            form.errors[
                                                `questions.${index}.order`
                                            ]
                                        }
                                    />
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    type="button"
                                    onClick={() => removeRow(index)}
                                >
                                    Delete
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </FormDialog>
    );
}
