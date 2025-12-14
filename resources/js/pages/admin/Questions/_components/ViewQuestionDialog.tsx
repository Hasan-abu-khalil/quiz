import * as React from "react";
import { useState } from "react";
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
import { CheckCircle2, XCircle, History, X } from "lucide-react";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Option {
    id: number;
    option_text: string;
    is_correct: boolean;
}

interface StateHistory {
    id: number;
    from_state: string | null;
    to_state: string;
    changed_by: {
        id: number;
        name: string;
    } | null;
    notes: string | null;
    created_at: string;
}

interface Question {
    id: number;
    subject_id: number;
    question_text: string;
    subject?: Subject;
    tags?: Tag[];
    options?: Option[];
}

interface ViewQuestionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question: Question | null;
    questionHistory?: StateHistory[];
}

export function ViewQuestionDialog({
    open,
    onOpenChange,
    question,
    questionHistory = [],
}: ViewQuestionDialogProps) {
    const [showHistory, setShowHistory] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-hidden ${
                    showHistory ? "max-w-6xl" : ""
                }`}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Question Details</DialogTitle>
                            <DialogDescription>
                                View question information
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                            className={
                                showHistory
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                            }
                        >
                            <History className="h-4 w-4 mr-2" />
                            {showHistory ? "Hide" : "Show"} History
                        </Button>
                    </div>
                </DialogHeader>
                {question && (
                    <div className="flex gap-4 overflow-hidden">
                        <div
                            className={`grid gap-4 py-4 ${
                                showHistory
                                    ? "flex-1 overflow-y-auto"
                                    : "w-full"
                            }`}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">
                                        Subject
                                    </Label>
                                    <p className="text-sm font-medium">
                                        {question.subject?.name || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">
                                    Question Text
                                </Label>
                                <p className="text-sm font-medium whitespace-pre-wrap mt-1">
                                    {question.question_text}
                                </p>
                            </div>
                            {question.tags && question.tags.length > 0 && (
                                <div>
                                    <Label className="text-muted-foreground mb-2">
                                        Tags
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {question.tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                            >
                                                {tag.tag_text}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {question.options &&
                                question.options.length > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground mb-2">
                                            Options
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {question.options.map(
                                                (option, index) => (
                                                    <div
                                                        key={option.id}
                                                        className={`p-3 border rounded-lg ${
                                                            option.is_correct
                                                                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50"
                                                                : "bg-background"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-medium">
                                                                Option{" "}
                                                                {index + 1}
                                                            </span>
                                                            {option.is_correct ? (
                                                                <Badge
                                                                    variant="default"
                                                                    className="bg-green-400 hover:bg-green-500 text-xs"
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Correct
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Incorrect
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs whitespace-pre-wrap">
                                                            {option.option_text}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                        {showHistory && (
                            <div className="w-80 border-l pl-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
                                <div className="flex items-center justify-between mb-4 sticky top-0 bg-background pb-2 border-b">
                                    <h3 className="font-semibold">
                                        Status History
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowHistory(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {questionHistory &&
                                questionHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {questionHistory.map((history) => (
                                            <div
                                                key={history.id}
                                                className="border-l-2 border-primary pl-3 pb-3"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {history.from_state
                                                                ? `${history.from_state} → ${history.to_state}`
                                                                : `Created → ${history.to_state}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    {new Date(
                                                        history.created_at
                                                    ).toLocaleString()}
                                                </p>
                                                {history.changed_by && (
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        Changed by:{" "}
                                                        {
                                                            history.changed_by
                                                                .name
                                                        }
                                                    </p>
                                                )}
                                                {history.notes && (
                                                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                                                        {history.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No history available
                                    </p>
                                )}
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
