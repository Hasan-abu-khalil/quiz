import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Tag {
    id: number;
    tag_text: string;
}

interface Question {
    id: number;
    question_text: string;
}

interface Subject {
    id: number;
    name: string;
    description?: string;
    tags?: Tag[];
    questions?: Question[];
}

interface ViewSubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: Subject | null;
}

export function ViewSubjectDialog({
    open,
    onOpenChange,
    subject,
}: ViewSubjectDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Subject Details</DialogTitle>
                    <DialogDescription>
                        View subject information
                    </DialogDescription>
                </DialogHeader>

                {subject && (
                    <div className="grid gap-4 py-4">
                        {/* Subject Name */}
                        <div>
                            <Label className="text-muted-foreground">
                                Name
                            </Label>
                            <p className="text-sm font-medium mt-1">
                                {subject.name}
                            </p>
                        </div>

                        {/* Subject Description */}
                        {subject.description && (
                            <div>
                                <Label className="text-muted-foreground">
                                    Description
                                </Label>
                                <p className="text-sm whitespace-pre-wrap mt-1">
                                    {subject.description}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {subject.tags && subject.tags.length > 0 && (
                            <div>
                                <Label className="text-muted-foreground mb-2">
                                    Tags
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {subject.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary">
                                            {tag.tag_text}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions */}
                        {subject.questions && subject.questions.length > 0 && (
                            <div>
                                <Label className="text-muted-foreground mb-2">
                                    Questions
                                </Label>
                                <div className="space-y-2">
                                    {subject.questions.map((q, index) => (
                                        <div
                                            key={q.id}
                                            className="p-3 border rounded-lg bg-background"
                                        >
                                            <p className="text-xs font-medium mb-1">
                                                Question {index + 1}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">
                                                {q.question_text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
