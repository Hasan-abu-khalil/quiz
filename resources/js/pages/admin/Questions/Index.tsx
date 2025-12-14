import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { CreateQuestionDialog } from "./_components/CreateQuestionDialog";
import { ViewQuestionDialog } from "./_components/ViewQuestionDialog";
import { EditQuestionDialog } from "./_components/EditQuestionDialog";
import { DeleteQuestionDialog } from "./_components/DeleteQuestionDialog";
import { ImportQuestionsDialog } from "./_components/ImportQuestionsDialog";
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

interface Question {
    id: number;
    subject_id: number;
    question_text: string;
    subject?: Subject;
    tags?: Tag[];
    options?: Option[];
}

interface Props {
    questions: {
        data: Question[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    subjects: Subject[];
    tags: Tag[];
}

export default function Index({ questions, subjects, tags, filters }: any) {
    const [search, setSearch] = useState(filters.search || "");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                "/admin/questions",
                { search },
                { preserveState: true, replace: true }
            );
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
        null
    );
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    

    const handleView = (question: Question) => {
        setSelectedQuestion(question);
        setViewDialogOpen(true);
    };

    const handleEdit = (question: Question) => {
        setSelectedQuestion(question);
        setEditDialogOpen(true);
    };

    const handleDelete = (question: Question) => {
        setSelectedQuestion(question);
        setDeleteDialogOpen(true);
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url);
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Questions", href: "/admin/questions" },
            ]}
        >
            <Head title="Questions" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Questions</CardTitle>
                            <div >
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Question
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setImportDialogOpen(true)}
                                    className="mx-3"
                                >
                                    Import Excel
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="mb-4 flex w-[220px] gap-2">
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border px-2 py-1 rounded w-full mb-4"
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Question Text</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center"
                                        >
                                            No questions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    questions.data.map((question) => (
                                        <TableRow key={question.id}>
                                            <TableCell>{question.id}</TableCell>
                                            <TableCell>
                                                {question.subject?.name ||
                                                    "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-md">
                                                    <div className="truncate">
                                                        {question.question_text}
                                                    </div>
                                                    {question.tags &&
                                                        question.tags.length >
                                                            0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {question.tags.map(
                                                                    (tag) => (
                                                                        <span
                                                                            key={
                                                                                tag.id
                                                                            }
                                                                            className="text-xs bg-muted px-2 py-0.5 rounded"
                                                                        >
                                                                            {
                                                                                tag.tag_text
                                                                            }
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleView(question)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(question)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                question
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center space-x-1">
                                {/* Prev */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!questions.prev_page_url}
                                    onClick={() =>
                                        goToPage(questions.prev_page_url)
                                    }
                                >
                                    Prev
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const pages = [];
                                    const total = questions.last_page;
                                    const current = questions.current_page;
                                    const maxVisible = 5;

                                    // Always show page 1
                                    pages.push(1);

                                    // Sliding window range
                                    let start = Math.max(2, current - 2);
                                    let end = Math.min(total - 1, current + 2);

                                    if (current <= 3) {
                                        end = Math.min(6, total - 1);
                                    }

                                    if (current >= total - 2) {
                                        start = Math.max(2, total - 5);
                                    }

                                    // Ellipsis after page 1
                                    if (start > 2) {
                                        pages.push("...");
                                    }

                                    // Middle pages
                                    for (let i = start; i <= end; i++) {
                                        pages.push(i);
                                    }

                                    // Ellipsis before last page
                                    if (end < total - 1) {
                                        pages.push("...");
                                    }

                                    // Always show last page (if > 1)
                                    if (total > 1) {
                                        pages.push(total);
                                    }

                                    return pages.map((page, index) =>
                                        page === "..." ? (
                                            <span key={index} className="px-2">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    goToPage(
                                                        `/admin/questions?page=${page}`
                                                    )
                                                }
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    questions.current_page ===
                                                    page
                                                        ? "bg-blue-600 text-white"
                                                        : "hover:bg-gray-100"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    );
                                })()}

                                {/* Next */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!questions.next_page_url}
                                    onClick={() =>
                                        goToPage(questions.next_page_url)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <CreateQuestionDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    subjects={subjects}
                    tags={tags}
                />

                <ImportQuestionsDialog
                    open={importDialogOpen}
                    onOpenChange={setImportDialogOpen}
                />

                <ViewQuestionDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    question={selectedQuestion}
                />

                <EditQuestionDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    question={selectedQuestion}
                    subjects={subjects}
                    tags={tags}
                />

                <DeleteQuestionDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    question={selectedQuestion}
                />
            </div>
        </AdminLayout>
    );
}
