import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableFooter,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateQuizDialog } from "./_components/CreateQuizDialog";
import { ViewQuizDialog } from "./_components/ViewQuizDialog";
import { EditQuizDialog } from "./_components/EditQuizDialog";
import { DeleteQuizDialog } from "./_components/DeleteQuizDialog";
import axios from "axios";
import { toast } from "sonner";
import { Question } from "../Questions/Index";
interface Subject {
    id: number;
    name: string;
}

interface Quiz {
    id: number;
    title: string;
    mode: string;
    subject_id?: number;
    time_limit_minutes?: number;
    total_questions?: number;
    subject?: Subject;
}

interface Props {
    quizzes: {
        data: Quiz[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        total?: number;
        per_page?: number;
        from?: number;
        to?: number;
    };
    subjects: Subject[];
    filters: {
        search?: string;
    };
    questions: Question[];
}

const formatMode = (mode: string) => {
    const modeMap: Record<string, string> = {
        by_subject: "By Subject",
        mixed_bag: "Mixed Bag",
        timed: "Timed",
    };
    return modeMap[mode] || mode;
};

export default function Index({
    quizzes,
    subjects,
    questions,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                "/admin/quizzes",
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
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const handleView = async (quiz: Quiz) => {
        const response = await axios.get(`/admin/quizzes/${quiz.id}`);
        setSelectedQuiz(response.data.quiz);
        setViewDialogOpen(true);
    };
    const handleEdit = async (quiz: Quiz) => {
        try {
            // Fetch the full quiz with questions from the backend
            const response = await axios.get(`/admin/quizzes/${quiz.id}`);
            setSelectedQuiz(response.data.quiz);
            setEditDialogOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch quiz data");
        }
    };

    const handleDelete = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setDeleteDialogOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === quizzes.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(quizzes.data.map((q: Quiz) => q.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        if (
            confirm(
                `Are you sure you want to delete ${selectedIds.size} quiz(zes)?`
            )
        ) {
            router.delete(route("admin.quizzes.bulkDestroy"), {
                data: { ids: Array.from(selectedIds) },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    router.reload({ only: ["quizzes"] });
                },
            });
        }
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url);
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Quizzes", href: "/admin/quizzes" },
            ]}
        >
            <Head title="Quizzes" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Quizzes</CardTitle>
                            <div className="flex items-center gap-4">
                                {selectedIds.size > 0 && (
                                    <>
                                        <span className="text-sm text-muted-foreground">
                                            {selectedIds.size} selected
                                        </span>
                                        <Button
                                            variant="destructive"
                                            onClick={handleBulkDelete}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete Selected
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Quiz
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="mb-4 flex w-[220px] gap-2">
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border px-2 py-1 rounded w-full mb-4"
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={
                                                quizzes.data.length > 0 &&
                                                selectedIds.size ===
                                                    quizzes.data.length
                                            }
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Time Limit</TableHead>
                                    <TableHead>Questions</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quizzes.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="w-12"></TableCell>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center"
                                        >
                                            No quizzes found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quizzes.data.map((quiz) => (
                                        <TableRow key={quiz.id}>
                                            <TableCell className="w-12">
                                                <Checkbox
                                                    checked={selectedIds.has(
                                                        quiz.id
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelect(quiz.id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>{quiz.id}</TableCell>
                                            <TableCell>{quiz.title}</TableCell>
                                            <TableCell>
                                                {quiz.subject?.name || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {formatMode(quiz.mode)}
                                            </TableCell>
                                            <TableCell>
                                                {quiz.time_limit_minutes
                                                    ? `${quiz.time_limit_minutes} min`
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {quiz.total_questions || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleView(quiz)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(quiz)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(quiz)
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
                                    disabled={!quizzes.prev_page_url}
                                    onClick={() =>
                                        goToPage(quizzes.prev_page_url)
                                    }
                                >
                                    Prev
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const pages = [];
                                    const total = quizzes.last_page;
                                    const current = quizzes.current_page;
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
                                                        `/admin/quizzes?page=${page}`
                                                    )
                                                }
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    quizzes.current_page ===
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
                                    disabled={!quizzes.next_page_url}
                                    onClick={() =>
                                        goToPage(quizzes.next_page_url)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        {quizzes && (
                            <div className="text-center mt-4 text-sm text-muted-foreground">
                                Total: {quizzes.total || quizzes.data.length}{" "}
                                quiz(zes)
                            </div>
                        )}
                    </CardContent>
                </Card>

                <CreateQuizDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    subjects={subjects}
                    questions={questions}
                />

                <ViewQuizDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    quiz={selectedQuiz}
                />

                <EditQuizDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    quiz={selectedQuiz}
                    subjects={subjects}
                    allQuestions={questions}
                />

                <DeleteQuizDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    quiz={selectedQuiz}
                />
            </div>
        </AdminLayout>
    );
}
