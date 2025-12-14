import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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
    state?: string;
    assigned_to?: number;
    assigned_to_user?: {
        id: number;
        name: string;
    };
    subject?: Subject;
    tags?: Tag[];
    options?: Option[];
    state_history?: StateHistory[];
}

interface Props {
    question: Question;
}

export default function Show({ question }: Props) {
    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Questions", href: "/admin/questions" },
                {
                    title: `Question ${question.id}`,
                    href: `/admin/questions/${question.id}`,
                },
            ]}
        >
            <Head title={`Question: ${question.id}`} />
            <div className="p-6">
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin/questions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Questions
                        </Link>
                    </Button>
                </div>

                <div className="flex gap-6">
                    <div className="flex-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Question Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">
                                            ID
                                        </Label>
                                        <p className="text-lg font-semibold">
                                            {question.id}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Subject
                                        </Label>
                                        <p className="text-lg font-semibold">
                                            {question.subject?.name || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                {question.state && (
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Status
                                        </Label>
                                        <div className="mt-1">
                                            <Badge
                                                className={
                                                    question.state === "initial"
                                                        ? "bg-gray-200"
                                                        : question.state ===
                                                          "under-review"
                                                        ? "bg-yellow-200"
                                                        : "bg-green-200"
                                                }
                                            >
                                                {question.state === "initial"
                                                    ? "Unassigned"
                                                    : question.state ===
                                                      "under-review"
                                                    ? "Under Review"
                                                    : "Done"}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-muted-foreground mb-2">
                                        Question Text
                                    </Label>
                                    <p className="text-base whitespace-pre-wrap">
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
                            </CardContent>
                        </Card>

                        {question.options && question.options.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Options</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        {question.options.map(
                                            (option, index) => (
                                                <div
                                                    key={option.id}
                                                    className={`p-4 border rounded-lg ${
                                                        option.is_correct
                                                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50"
                                                            : "bg-background"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium">
                                                            Option {index + 1}
                                                        </span>
                                                        {option.is_correct ? (
                                                            <Badge
                                                                variant="default"
                                                                className="bg-green-400 hover:bg-green-500"
                                                            >
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Correct
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Incorrect
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">
                                                        {option.option_text}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="w-80 border-l pl-6">
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Status History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                                    {question.state_history &&
                                    question.state_history.length > 0 ? (
                                        question.state_history.map(
                                            (history) => (
                                                <div
                                                    key={history.id}
                                                    className="border-l-2 border-primary pl-3 pb-3"
                                                >
                                                    <div className="mb-1">
                                                        <span className="text-sm font-medium">
                                                            {history.from_state
                                                                ? `${history.from_state} → ${history.to_state}`
                                                                : `Created → ${history.to_state}`}
                                                        </span>
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
                                                                history
                                                                    .changed_by
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
                                            )
                                        )
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No history available
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
