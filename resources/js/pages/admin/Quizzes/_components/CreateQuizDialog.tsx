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

interface Subject {
    id: number;
    name: string;
}

interface CreateQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjects: Subject[];
}

export function CreateQuizDialog({
    open,
    onOpenChange,
    subjects,
}: CreateQuizDialogProps) {
    const form = useForm({
        title: "",
        mode: "by_subject",
        subject_id: "",
        time_limit_minutes: "",
        total_questions: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route("admin.quizzes.create"), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                form.clearErrors();
                toast.success("Quiz created successfully");
            },
            onError: () => {
                toast.error("Please fix the errors in the form");
            },
        });
    };

    const handleReset = () => {
        form.reset();
        form.clearErrors();
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Add New Quiz"
            description="Create a new quiz"
            submitButtonText="Create Quiz"
            onSubmit={handleSubmit}
            onReset={handleReset}
            isProcessing={form.processing}
        >
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={form.data.title}
                    onChange={(e) => form.setData("title", e.target.value)}
                    required
                />
                <InputError message={form.errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="mode">Mode</Label>
                <Select
                    value={form.data.mode}
                    onValueChange={(value) => form.setData("mode", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="by_subject">By Subject</SelectItem>
                        <SelectItem value="mixed_bag">Mixed Bag</SelectItem>
                        <SelectItem value="timed">Timed</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={form.errors.mode} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="subject_id">Subject (Optional)</Label>
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
                        form.setData("time_limit_minutes", e.target.value)
                    }
                />
                <InputError message={form.errors.time_limit_minutes} />
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
                        form.setData("total_questions", e.target.value)
                    }
                />
                <InputError message={form.errors.total_questions} />
            </div>
        </FormDialog>
    );
}
