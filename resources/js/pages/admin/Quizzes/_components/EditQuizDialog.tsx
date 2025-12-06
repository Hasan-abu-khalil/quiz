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

interface Subject {
    id: number;
    name: string;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    subject_id?: number;
    time_limit_minutes?: number;
    total_questions?: number;
}

interface EditQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quiz: Quiz | null;
    subjects: Subject[];
}

export function EditQuizDialog({
    open,
    onOpenChange,
    quiz,
    subjects,
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
    });

    // Update form when quiz changes
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
            });
        }
    }, [quiz]);

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
            onError: () => {
                toast.error("Please fix the errors in the form");
            },
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
            });
            form.clearErrors();
        }
    };

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
                    <div className="grid gap-4 py-4">
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? "Updating..." : "Update Quiz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
