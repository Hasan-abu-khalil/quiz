import * as React from "react";
import { router } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Subject {
    id: number;
    name: string;
}

interface DeleteSubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: Subject | null;
    onSuccess?: () => void;
}

export function DeleteSubjectDialog({
    open,
    onOpenChange,
    subject,
    onSuccess,
}: DeleteSubjectDialogProps) {
    const handleDelete = () => {
        if (!subject) return;

        router.delete(route("admin.subjects.destroy", subject.id), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                onSuccess?.();
                toast.success("Subject deleted successfully");
            },
            onError: (errors) => {
                const errorMessage =
                    errors.message ||
                    errors.error ||
                    "Failed to delete subject";
                toast.error(errorMessage);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Subject</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this subject? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {subject && (
                    <div className="py-4">
                        <p className="text-sm">
                            <strong>Subject:</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {subject.name}
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Delete Subject
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
