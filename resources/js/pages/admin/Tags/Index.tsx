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
import { SmartPagination } from "@/components/common/SmartPagination";
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

    // Reset select all mode when filters change
    useEffect(() => {
        setSelectAllMode(false);
        setSelectedIds(new Set());
        setAllFilteredIds([]);
    }, [search]);

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
    const [selectAllMode, setSelectAllMode] = useState(false);
    const [allFilteredIds, setAllFilteredIds] = useState<number[]>([]);

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
        if (selectedIds.size === tags.data.length && !selectAllMode) {
            setSelectedIds(new Set());
            setSelectAllMode(false);
        } else {
            setSelectedIds(new Set(tags.data.map((t: Tag) => t.id)));
            setSelectAllMode(false);
        }
    };

    const handleSelectAllFiltered = async () => {
        if (selectAllMode) {
            // Deselect all
            setSelectedIds(new Set());
            setSelectAllMode(false);
            setAllFilteredIds([]);
        } else {
            // Fetch all IDs matching current filter
            const params = new URLSearchParams();
            if (search) {
                params.append("search", search);
            }

            try {
                const response = await fetch(
                    `/admin/tags/ids?${params.toString()}`
                );
                const data = await response.json();
                setAllFilteredIds(data.ids || []);
                setSelectedIds(new Set(data.ids || []));
                setSelectAllMode(true);
            } catch (error) {
                console.error("Failed to fetch all tag IDs:", error);
            }
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        const idsToDelete = selectAllMode
            ? allFilteredIds
            : Array.from(selectedIds);

        if (
            confirm(
                `Are you sure you want to delete ${idsToDelete.length} tag(s)?`
            )
        ) {
            router.delete("/admin/tags/bulk", {
                data: { ids: idsToDelete },
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    setSelectAllMode(false);
                    setAllFilteredIds([]);
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
                                <div className="flex items-center gap-4">
                                    {selectedIds.size > 0 && (
                                        <>
                                            <span className="text-sm text-muted-foreground">
                                                {selectAllMode
                                                    ? `All ${selectedIds.size} selected`
                                                    : `${selectedIds.size} selected`}
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
                                    {tags.total !== undefined &&
                                        tags.total > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllFiltered}
                                            >
                                                {selectAllMode
                                                    ? `Deselect All (${tags.total})`
                                                    : `Select All (${tags.total})`}
                                            </Button>
                                        )}
                                </div>
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
                                                selectAllMode ||
                                                (tags.data.length > 0 &&
                                                    selectedIds.size ===
                                                        tags.data.length)
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

                        <SmartPagination
                            currentPage={tags.current_page}
                            totalPages={tags.last_page}
                            onPageChange={() => {}}
                            prevPageUrl={tags.prev_page_url}
                            nextPageUrl={tags.next_page_url}
                            onUrlChange={goToPage}
                            buildUrl={(page) => `/admin/tags?page=${page}`}
                        />
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
