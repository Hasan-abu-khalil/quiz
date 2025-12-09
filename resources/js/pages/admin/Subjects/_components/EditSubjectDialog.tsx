import * as React from "react";
import { useForm } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import { FormDialog } from "@/components/FormDialog";

interface Subject {
    id: number;
    name: string;
}

interface EditSubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: Subject | null;
}

export function EditSubjectDialog({
    open,
    onOpenChange,
    subject,
}: EditSubjectDialogProps) {
    const form = useForm({
        name: subject?.name || "",
    });

    React.useEffect(() => {
        if (subject) {
            form.setData({
                name: subject.name,
            });
        }
        form.clearErrors();
    }, [subject]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) return;

        form.post(route("admin.subjects.update", subject.id), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                toast.success("Subject updated successfully");
            },
            onError: () => {
                toast.error("Please fix the errors and try again");
            },
        });
    };

    const handleReset = () => {
        if (subject) {
            form.setData({
                name: subject.name,
            });
        }
        form.clearErrors();
    };

    if (!subject) return null;

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Subject"
            description="Update the subject name"
            submitButtonText="Update Subject"
            onSubmit={handleSubmit}
            onReset={handleReset}
            isProcessing={form.processing}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                    required
                    placeholder="Enter subject name..."
                />
                <InputError message={form.errors.name} />
            </div>
        </FormDialog>
    );
}
