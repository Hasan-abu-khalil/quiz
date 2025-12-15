import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { CreateSubjectDialog } from "./_components/CreateSubjectDialog";
import { ViewSubjectDialog } from "./_components/ViewSubjectDialog";
import { EditSubjectDialog } from "./_components/EditSubjectDialog";
import { DeleteSubjectDialog } from "./_components/DeleteSubjectDialog";

interface Subject {
    id: number;
    name: string;
}

interface Props {
    subjects: {
        data: Subject[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        total?: number;
        per_page?: number;
        from?: number;
        to?: number;
    };
    filters: {
        search?: string;
    };
}

export default function Index({ subjects, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                "/admin/subjects",
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

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(
        null
    );
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const handleView = (subject: Subject) => {
        setSelectedSubject(subject);
        setViewDialogOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setSelectedSubject(subject);
        setEditDialogOpen(true);
    };

    const handleDelete = (subject: Subject) => {
        setSelectedSubject(subject);
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
        if (selectedIds.size === subjects.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(subjects.data.map((s: Subject) => s.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        if (
            confirm(
                `Are you sure you want to delete ${selectedIds.size} subject(s)?`
            )
        ) {
            router.delete(route("admin.subjects.bulkDestroy"), {
                data: { ids: Array.from(selectedIds) },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    router.reload({ only: ["subjects"] });
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
                { title: "Subjects", href: "/admin/subjects" },
            ]}
        >
            <Head title="Subjects" />

            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Subjects</CardTitle>
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
                                    Add Subject
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
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={
                                                subjects.data.length > 0 &&
                                                selectedIds.size ===
                                                    subjects.data.length
                                            }
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="w-12"></TableCell>
                                        <TableCell
                                            colSpan={3}
                                            className="text-center"
                                        >
                                            No subjects found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    subjects.data.map((subject) => (
                                        <TableRow key={subject.id}>
                                            <TableCell className="w-12">
                                                <Checkbox
                                                    checked={selectedIds.has(
                                                        subject.id
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelect(subject.id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>{subject.id}</TableCell>
                                            <TableCell>
                                                {subject.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleView(subject)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(subject)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                subject
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
                                    disabled={!subjects.prev_page_url}
                                    onClick={() =>
                                        goToPage(subjects.prev_page_url)
                                    }
                                >
                                    Prev
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const pages = [];
                                    const total = subjects.last_page;
                                    const current = subjects.current_page;
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
                                                        `/admin/subjects?page=${page}`
                                                    )
                                                }
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    subjects.current_page ===
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
                                    disabled={!subjects.next_page_url}
                                    onClick={() =>
                                        goToPage(subjects.next_page_url)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        {subjects && (
                            <div className="text-center mt-4 text-sm text-muted-foreground">
                                Total: {subjects.total || subjects.data.length}{" "}
                                subject(s)
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogs */}
                <CreateSubjectDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                />
                <ViewSubjectDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    subject={selectedSubject}
                />
                <EditSubjectDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    subject={selectedSubject}
                />
                <DeleteSubjectDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    subject={selectedSubject}
                />
            </div>
        </AdminLayout>
    );
}
