import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

interface Tag {
    id: number;
    tag_text: string;
}

interface QuickCreateTagDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTagCreated?: (tag: Tag) => void;
}

export function QuickCreateTagDialog({
    open,
    onOpenChange,
    onTagCreated,
}: QuickCreateTagDialogProps) {
    const [tagText, setTagText] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [processing, setProcessing] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent form
        setError(null);
        setProcessing(true);

        try {
            const response = await api.post(
                route("admin.tags.create"),
                {
                    tag_text: tagText,
                },
                {
                    headers: {
                        "X-Quick-Create": "true",
                    },
                }
            );

            if (response.data?.success && response.data?.tag) {
                setTagText("");
                setError(null);
                onTagCreated?.(response.data.tag);
                onOpenChange(false);
                toast.success("Tag created successfully");
            }
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const firstError = Object.values(errors)[0];
                setError(
                    Array.isArray(firstError)
                        ? firstError[0]
                        : (firstError as string)
                );
                toast.error("Please fix the errors in the form");
            } else {
                const errorMessage =
                    err.response?.data?.message || "Failed to create tag";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            setTagText("");
            setError(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Tag</DialogTitle>
                        <DialogDescription>
                            Quickly create a new tag to use in questions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="tag_text">Tag Text</Label>
                            <Input
                                id="tag_text"
                                value={tagText}
                                onChange={(e) => setTagText(e.target.value)}
                                required
                                autoFocus
                                placeholder="e.g., Algebra, Geometry, etc."
                            />
                            {error && <InputError message={error} />}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Creating..." : "Create Tag"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
