import * as React from "react";
import { useForm } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import { FormDialog } from "@/components/FormDialog";
import { Input } from "@/components/ui/input";

interface CreateSubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSubjectDialog({
    open,
    onOpenChange,
}: CreateSubjectDialogProps) {
    const form = useForm({
        name: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route("admin.subjects.create"), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                form.clearErrors();
                toast.success("Subject created successfully");
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
            title="Add New Subject"
            description="Create a new subject"
            submitButtonText="Create Subject"
            onSubmit={handleSubmit}
            onReset={handleReset}
            isProcessing={form.processing}
            closeOnInteractOutside={false}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                    placeholder="Enter subject name..."
                    required
                />
                <InputError message={form.errors.name} />
            </div>
        </FormDialog>
    );
}
