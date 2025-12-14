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

    const submit = () => {
        if (!file) {
            setError("Please select a file to import.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        router.post("/admin/questions/import", formData, {
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
                setError(null);
            },
            onError: (errors: any) => {
                // Laravel validation errors come in `errors.file`
                setError(errors.file || "Failed to import the file.");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Questions from Excel</DialogTitle>
                </DialogHeader>

                <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <Button className="mt-4" onClick={submit}>
                    Import
                </Button>
            </DialogContent>
        </Dialog>
    );
}
