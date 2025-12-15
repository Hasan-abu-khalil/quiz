import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { useState } from "react";

export function ImportQuestionsDialog({ open, onOpenChange }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        // Prevent accidental close while uploading
        if (isSubmitting) return;
        onOpenChange(nextOpen);
    };

    const submit = () => {
        if (!file) {
            setError("Please select a file to import.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        router.post("/admin/questions/import", formData, {
            forceFormData: true,
            onStart: () => setIsSubmitting(true),
            onSuccess: () => {
                onOpenChange(false);
                setError(null);
            },
            onError: (errors: any) => {
                // Laravel validation errors come in `errors.file`
                setError(errors.file || "Failed to import the file.");
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                // Block closing via escape or outside click while uploading
                onEscapeKeyDown={(event) => {
                    if (isSubmitting) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (isSubmitting) event.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Import Questions from Excel</DialogTitle>
                </DialogHeader>

                <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={isSubmitting}
                />

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <Button
                    className="mt-4"
                    onClick={submit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Uploading..." : "Import"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
