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
import { Checkbox } from "@/components/ui/checkbox";
import { CreateTagDialog } from "./_components/CreateTagDialog";
import { ViewTagDialog } from "./_components/ViewTagDialog";
import { EditTagDialog } from "./_components/EditTagDialog";
import { DeleteTagDialog } from "./_components/DeleteTagDialog";

interface Tag {
    id: number;
    tag_text: string;
}

interface Props {
    tags: {
        data: Tag[];
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

export default function Index({ tags, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                "/admin/tags",
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
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const handleView = (tag: Tag) => {
        setSelectedTag(tag);
        setViewDialogOpen(true);
    };

    const handleEdit = (tag: Tag) => {
        setSelectedTag(tag);
        setEditDialogOpen(true);
    };

    const handleDelete = (tag: Tag) => {
        setSelectedTag(tag);
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
        if (selectedIds.size === tags.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(tags.data.map((t: Tag) => t.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        if (
            confirm(
                `Are you sure you want to delete ${selectedIds.size} tag(s)?`
            )
        ) {
            router.delete(route("admin.tags.bulkDestroy"), {
                data: { ids: Array.from(selectedIds) },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    router.reload({ only: ["tags"] });
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
                { title: "Tags", href: "/admin/tags" },
            ]}
        >
            <Head title="Tags" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Tags</CardTitle>
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
                                    Add Tag
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
                                                tags.data.length > 0 &&
                                                selectedIds.size ===
                                                    tags.data.length
                                            }
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tag Text</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="w-12"></TableCell>
                                        <TableCell
                                            colSpan={3}
                                            className="text-center"
                                        >
                                            No tags found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tags.data.map((tag) => (
                                        <TableRow key={tag.id}>
                                            <TableCell className="w-12">
                                                <Checkbox
                                                    checked={selectedIds.has(
                                                        tag.id
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelect(tag.id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>{tag.id}</TableCell>
                                            <TableCell>
                                                {tag.tag_text}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleView(tag)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(tag)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(tag)
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
                                    disabled={!tags.prev_page_url}
                                    onClick={() => goToPage(tags.prev_page_url)}
                                >
                                    Prev
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const pages = [];
                                    const total = tags.last_page;
                                    const current = tags.current_page;
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
                                                        `/admin/tags?page=${page}`
                                                    )
                                                }
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    tags.current_page === page
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
                                    disabled={!tags.next_page_url}
                                    onClick={() => goToPage(tags.next_page_url)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        {tags && (
                            <div className="text-center mt-4 text-sm text-muted-foreground">
                                Total: {tags.total || tags.data.length} tag(s)
                            </div>
                        )}
                    </CardContent>
                </Card>

                <CreateTagDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                />

                <ViewTagDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    tag={selectedTag}
                />

                <EditTagDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    tag={selectedTag}
                />

                <DeleteTagDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    tag={selectedTag}
                />
            </div>
        </AdminLayout>
    );
}
