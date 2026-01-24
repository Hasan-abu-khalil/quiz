import { Head, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import * as React from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { QuestionStatusBadge } from "@/components/common/QuestionStatusBadge";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import {
    Plus,
    X,
    FileUp,
    UserPlus,
    CheckCircle,
    Trash2,
    Clock,
} from "lucide-react";
import { DeleteQuestionDialog } from "./_components/DeleteQuestionDialog";
import { SmartPagination } from "@/components/common/SmartPagination";
import { TagCombobox } from "@/components/TagCombobox";
import { ImportQuestionsDialog } from "./_components/ImportQuestionsDialog";
import { useQuestionActions } from "@/hooks/useQuestionActions";
import { useQuestionActionHandlers } from "@/hooks/useQuestionActionHandlers";
import { QuestionActions } from "@/components/common/QuestionActions";
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

export interface Question {
    id: number;
    subject_id: number;
    question_text: string;
    state?: string;
    assigned_to?: number;
    assigned_to_user?: {
        id: number;
        name: string;
    };
    assignedTo?: {
        id: number;
        name: string;
    };
    creator?: {
        id: number;
        name: string;
        roles: {
            id: number;
            name: string;
        }[];
    };
    subject?: Subject;
    tags?: Tag[];
    options?: Option[];
    state_history?: StateHistory[];
}

interface Props {
    questions: {
        data: Question[];
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
    tags: Tag[];
    filters: {
        search?: string;
        tab?: string;
        subject_id?: string;
        tag_id?: string | string[];
    };
}

export default function Index({ questions, subjects, tags, filters }: Props) {
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;
    const [activeTab, setActiveTab] = useState(filters.tab || "all");
    const [search, setSearch] = useState(filters.search || "");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
        filters.subject_id ? parseInt(filters.subject_id) : null
    );
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
        filters.tag_id
            ? Array.isArray(filters.tag_id)
                ? filters.tag_id.map((id) => parseInt(id))
                : [parseInt(filters.tag_id)]
            : []
    );
    const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
    const [isMounted, setIsMounted] = useState(false);

    const getCurrentUrl = () => {
        const params = new URLSearchParams(window.location.search);
        // Always preserve page parameter if we're not on page 1
        // If page is in URL, keep it; if not but we're on page > 1, add it
        if (questions.current_page > 1) {
            params.set("page", questions.current_page.toString());
        } else if (params.has("page") && params.get("page") === "1") {
            // Remove page=1 to keep URL clean
            params.delete("page");
        }
        const queryString = params.toString();
        return `/admin/questions${queryString ? `?${queryString}` : ""}`;
    };

    const updateFilters = (updates: {
        tab?: string;
        search?: string;
        subject_id?: number | null;
        tag_ids?: number[] | null;
    }) => {
        const newTab = updates.tab !== undefined ? updates.tab : activeTab;
        const newSearch =
            updates.search !== undefined ? updates.search : search;
        const newSubjectId =
            updates.subject_id !== undefined
                ? updates.subject_id
                : selectedSubjectId;
        const newTagIds =
            updates.tag_ids !== undefined
                ? updates.tag_ids
                : selectedTagIds;

        const params: any = {
            tab: newTab,
        };

        if (newSearch) {
            params.search = newSearch;
        }

        if (newSubjectId) {
            params.subject_id = newSubjectId;
        }

        if (newTagIds && newTagIds.length > 0) {
            params.tag_id = newTagIds;
        }

        router.get("/admin/questions", params, {
            preserveState: true,
            replace: true,
        });
    };

    // Fetch tags filtered by subject when subject changes
    useEffect(() => {
        if (selectedSubjectId) {
            fetch(`/admin/questions/tags-by-subject/${selectedSubjectId}`)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data: Tag[]) => {
                    setAvailableTags(data);
                    // Clear tag selection if current tags are not available for new subject
                    const validTagIds = data.map((t) => t.id);
                    const filteredTagIds = selectedTagIds.filter((id) =>
                        validTagIds.includes(id)
                    );
                    if (filteredTagIds.length !== selectedTagIds.length) {
                        setSelectedTagIds(filteredTagIds);
                        updateFilters({
                            tag_ids: filteredTagIds.length > 0 ? filteredTagIds : null,
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error fetching tags by subject:', error);
                    setAvailableTags(tags);
                });
        } else {
            setAvailableTags(tags);
        }
    }, [selectedSubjectId]);

    // Reset select all mode when filters change
    useEffect(() => {
        setSelectAllMode(false);
        setSelectedIds(new Set());
        setAllFilteredIds([]);
    }, [activeTab, search, selectedSubjectId, selectedTagIds]);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            updateFilters({ search });
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (isMounted) {
            updateFilters({ tab: activeTab });
        }
    }, [activeTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleSubjectFilter = (subjectId: number | null) => {
        setSelectedSubjectId(subjectId);
        updateFilters({ subject_id: subjectId });
    };

    const handleTagFilter = (tagIds: number[]) => {
        setSelectedTagIds(tagIds);
        updateFilters({ tag_ids: tagIds.length > 0 ? tagIds : null });
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
        null
    );
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectAllMode, setSelectAllMode] = useState(false);
    const [allFilteredIds, setAllFilteredIds] = useState<number[]>([]);

    const handlers = useQuestionActionHandlers({
        preserveFilters: {
            tab: activeTab,
            search,
            subject_id: selectedSubjectId,
            page: questions.current_page,
        },
    });

    // Override delete to show dialog
    const handleDelete = (question: { id: number;[key: string]: any }) => {
        setSelectedQuestion(question as Question);
        setDeleteDialogOpen(true);
    };
    handlers.onDelete = handleDelete as typeof handlers.onDelete;

    const handleDeleteSuccess = () => {
        // Preserve current URL with filters and page to maintain scroll and state
        router.get(
            getCurrentUrl(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ["questions"],
            }
        );
    };

    const goToPage = (url: string | null) => {
        if (url) {
            // Preserve current filters when navigating pages
            const urlObj = new URL(url, window.location.origin);
            if (!urlObj.searchParams.has("tab")) {
                urlObj.searchParams.set("tab", activeTab);
            }
            if (search && !urlObj.searchParams.has("search")) {
                urlObj.searchParams.set("search", search);
            }
            if (selectedSubjectId && !urlObj.searchParams.has("subject_id")) {
                urlObj.searchParams.set(
                    "subject_id",
                    selectedSubjectId.toString()
                );
            }
            if (selectedTagIds.length > 0) {
                // Remove existing tag_id params and add new ones
                urlObj.searchParams.delete("tag_id");
                selectedTagIds.forEach((tagId) => {
                    urlObj.searchParams.append("tag_id", tagId.toString());
                });
            }
            router.get(urlObj.pathname + urlObj.search);
        }
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
        if (selectedIds.size === questions.data.length && !selectAllMode) {
            setSelectedIds(new Set());
            setSelectAllMode(false);
        } else {
            setSelectedIds(new Set(questions.data.map((q: Question) => q.id)));
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
            if (activeTab && activeTab !== "all") {
                params.append("tab", activeTab);
            }
            if (search) {
                params.append("search", search);
            }
            if (selectedSubjectId) {
                params.append("subject_id", selectedSubjectId.toString());
            }
            if (selectedTagIds.length > 0) {
                selectedTagIds.forEach((tagId) => {
                    params.append("tag_id", tagId.toString());
                });
            }

            try {
                const response = await fetch(
                    `/admin/questions/ids?${params.toString()}`
                );
                const data = await response.json();
                setAllFilteredIds(data.ids || []);
                setSelectedIds(new Set(data.ids || []));
                setSelectAllMode(true);
            } catch (error) {
                console.error("Failed to fetch all question IDs:", error);
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
                `Are you sure you want to delete ${idsToDelete.length} question(s)?`
            )
        ) {
            router.delete("/admin/questions/bulk", {
                data: { ids: idsToDelete },
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    setSelectAllMode(false);
                    setAllFilteredIds([]);
                    // Preserve current URL with filters to maintain scroll and state
                    router.get(
                        window.location.pathname + window.location.search,
                        {},
                        {
                            preserveScroll: true,
                            preserveState: true,
                            only: ["questions"],
                        }
                    );
                },
            });
        }
    };

    const handleBulkAssign = () => {
        if (selectedIds.size === 0) return;

        const idsToAssign = selectAllMode
            ? allFilteredIds
            : Array.from(selectedIds);

        // Build query parameters to preserve current page and filters
        const params: any = {
            ids: idsToAssign,
        };
        if (activeTab && activeTab !== "all") {
            params.tab = activeTab;
        }
        if (search) {
            params.search = search;
        }
        if (selectedSubjectId) {
            params.subject_id = selectedSubjectId;
        }
        if (questions.current_page > 1) {
            params.page = questions.current_page;
        }

        router.post("/admin/questions/bulk/assign", params, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedIds(new Set());
                setSelectAllMode(false);
                setAllFilteredIds([]);
            },
        });
    };

    const handleBulkMarkAsDone = () => {
        if (selectedIds.size === 0) return;

        const idsToChange = selectAllMode
            ? allFilteredIds
            : Array.from(selectedIds);

        // Build query parameters to preserve current page and filters
        const params: any = {
            ids: idsToChange,
            state: "done",
        };
        if (activeTab && activeTab !== "all") {
            params.tab = activeTab;
        }
        if (search) {
            params.search = search;
        }
        if (selectedSubjectId) {
            params.subject_id = selectedSubjectId;
        }
        if (questions.current_page > 1) {
            params.page = questions.current_page;
        }

        router.post("/admin/questions/bulk/change-state", params, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedIds(new Set());
                setSelectAllMode(false);
                setAllFilteredIds([]);
            },
        });
    };

    const renderQuestionsTable = (questionsData: any) => {
        const showAssignedTo = activeTab !== "my-review";
        const colSpan = showAssignedTo ? 8 : 7;

        if (!questionsData || questionsData.data.length === 0) {
            return (
                <TableRow>
                    <TableCell className="w-12"></TableCell>
                    <TableCell colSpan={colSpan - 1} className="text-center">
                        No questions found
                    </TableCell>
                </TableRow>
            );
        }

        return questionsData.data.map((question: Question) => (
            <TableRow key={question.id}>
                <TableCell className="w-12">
                    <Checkbox
                        checked={selectedIds.has(question.id)}
                        onCheckedChange={() => toggleSelect(question.id)}
                    />
                </TableCell>
                <TableCell className="w-16">{question.id}</TableCell>
                <TableCell className="max-w-md">
                    <div
                        className="text-sm overflow-hidden"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {question.question_text}
                    </div>
                    {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {question.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="text-xs bg-muted px-2 py-0.5 rounded"
                                >
                                    {tag.tag_text}
                                </span>
                            ))}
                        </div>
                    )}
                </TableCell>
                <TableCell>
                    {question.subject ? (
                        <SubjectBadge subject={question.subject} as="span" />
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    )}
                </TableCell>
                <TableCell>{question.creator?.name || "N/A"}</TableCell>
                {showAssignedTo && (
                    <TableCell>
                        {question.assignedTo?.name ||
                            question.assigned_to_user?.name ||
                            "—"}
                    </TableCell>
                )}
                {question.state && (
                    <TableCell>
                        <QuestionStatusBadge state={question.state} as="span" />
                    </TableCell>
                )}
                <TableCell className="text-right">
                    <QuestionActions
                        actions={useQuestionActions({
                            question,
                            currentUser,
                            context: "row",
                            handlers,
                        })}
                        className="justify-end"
                    />
                </TableCell>
            </TableRow>
        ));
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <CardTitle>Questions</CardTitle>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-4 flex-wrap">
                                    {selectedIds.size > 0 && (
                                        <>
                                            <span className="text-sm text-muted-foreground">
                                                {selectAllMode
                                                    ? `All ${selectedIds.size} selected`
                                                    : `${selectedIds.size} selected`}
                                            </span>
                                            <Button
                                                variant="outline"
                                                onClick={handleBulkAssign}
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Assign to Me
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleBulkMarkAsDone}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Mark as Done
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleBulkDelete}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete Selected
                                            </Button>
                                        </>
                                    )}
                                    {questions.total !== undefined &&
                                        questions.total > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={
                                                    handleSelectAllFiltered
                                                }
                                            >
                                                {selectAllMode
                                                    ? `Deselect All (${questions.total})`
                                                    : `Select All (${questions.total})`}
                                            </Button>
                                        )}
                                </div>
                                <Button
                                    onClick={() =>
                                        router.visit("/admin/questions/create")
                                    }
                                >
                                    <Plus className="mr-2" />
                                    Add Question
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setImportDialogOpen(true)}
                                >
                                    <FileUp className="h-4 w-4 mr-1" />
                                    Import Excel
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Tabs
                                value={activeTab}
                                onValueChange={handleTabChange}
                            >
                                <p className="text-sm mb-2 text-slate-500">
                                    Set the questions and complete that before
                                    adding a new quiz
                                </p>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="all">
                                        All Questions
                                    </TabsTrigger>
                                    <TabsTrigger value="review">
                                        Available for Review
                                    </TabsTrigger>
                                    <TabsTrigger value="my-review">
                                        <Clock className="h-4 w-4 mr-1" />
                                        My Reviews
                                    </TabsTrigger>
                                </TabsList>
                                {/* Filters */}
                                <div className="mb-4 space-y-3">
                                    {/* Search */}
                                    <div className="flex w-[220px] gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search questions..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            className="border px-2 py-1 rounded w-full"
                                        />
                                    </div>

                                    {/* Subject Filter Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant={
                                                selectedSubjectId === null
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className="cursor-pointer"
                                            onClick={() =>
                                                handleSubjectFilter(null)
                                            }
                                        >
                                            All Subjects
                                        </Badge>
                                        {subjects.map((subject) => (
                                            <Badge
                                                key={subject.id}
                                                variant={
                                                    selectedSubjectId ===
                                                        subject.id
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    handleSubjectFilter(
                                                        subject.id
                                                    )
                                                }
                                            >
                                                {subject.name}
                                                {selectedSubjectId ===
                                                    subject.id && (
                                                        <X className="h-3 w-3 ml-1" />
                                                    )}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Tag Filter */}
                                    <div className="grid gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Filter by Tag:
                                        </span>
                                        <TagCombobox
                                            tags={availableTags}
                                            selectedTagIds={selectedTagIds}
                                            onSelectionChange={handleTagFilter}
                                            placeholder="Search tags to filter..."
                                            className="max-w-xs"
                                        />
                                    </div>
                                </div>
                                <TabsContent value="all">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={
                                                            selectAllMode ||
                                                            (questions.data
                                                                .length > 0 &&
                                                                selectedIds.size ===
                                                                questions
                                                                    .data
                                                                    .length)
                                                        }
                                                        onCheckedChange={
                                                            toggleSelectAll
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-16">
                                                    ID
                                                </TableHead>
                                                <TableHead>
                                                    Question Text
                                                </TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>
                                                    Created By
                                                </TableHead>
                                                {activeTab !== "my-review" && (
                                                    <TableHead>
                                                        Assigned To
                                                    </TableHead>
                                                )}
                                                <TableHead>State</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {renderQuestionsTable(questions)}
                                        </TableBody>
                                    </Table>

                                    {questions &&
                                        (questions.last_page > 1 ||
                                            questions.current_page > 1) &&
                                        !(
                                            questions.current_page === 1 &&
                                            questions.data.length === 0
                                        ) && (
                                            <SmartPagination
                                                currentPage={
                                                    questions.current_page
                                                }
                                                totalPages={questions.last_page}
                                                onPageChange={() => { }}
                                                prevPageUrl={
                                                    questions.prev_page_url
                                                }
                                                nextPageUrl={
                                                    questions.next_page_url
                                                }
                                                onUrlChange={goToPage}
                                                buildUrl={(page) => {
                                                    const params =
                                                        new URLSearchParams();
                                                    if (
                                                        activeTab &&
                                                        activeTab !== "all"
                                                    ) {
                                                        params.set(
                                                            "tab",
                                                            activeTab
                                                        );
                                                    }
                                                    if (search) {
                                                        params.set(
                                                            "search",
                                                            search
                                                        );
                                                    }
                                                    if (selectedSubjectId) {
                                                        params.set(
                                                            "subject_id",
                                                            selectedSubjectId.toString()
                                                        );
                                                    }
                                                    if (selectedTagIds.length > 0) {
                                                        selectedTagIds.forEach((tagId) => {
                                                            params.append("tag_id", tagId.toString());
                                                        });
                                                    }
                                                    params.set(
                                                        "page",
                                                        page.toString()
                                                    );
                                                    return `/admin/questions?${params.toString()}`;
                                                }}
                                            />
                                        )}
                                    {questions && (
                                        <div className="text-center mt-4 text-sm text-muted-foreground">
                                            Total:{" "}
                                            {questions.total ||
                                                questions.data.length}{" "}
                                            question(s)
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="review">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={
                                                            selectAllMode ||
                                                            (questions.data
                                                                .length > 0 &&
                                                                selectedIds.size ===
                                                                questions
                                                                    .data
                                                                    .length)
                                                        }
                                                        onCheckedChange={
                                                            toggleSelectAll
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-16">
                                                    ID
                                                </TableHead>
                                                <TableHead>
                                                    Question Text
                                                </TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>
                                                    Created By
                                                </TableHead>
                                                {activeTab !== "my-review" && (
                                                    <TableHead>
                                                        Assigned To
                                                    </TableHead>
                                                )}
                                                <TableHead>State</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {renderQuestionsTable(questions)}
                                        </TableBody>
                                    </Table>

                                    {questions &&
                                        (questions.last_page > 1 ||
                                            questions.current_page > 1) &&
                                        !(
                                            questions.current_page === 1 &&
                                            questions.data.length === 0
                                        ) && (
                                            <SmartPagination
                                                currentPage={
                                                    questions.current_page
                                                }
                                                totalPages={questions.last_page}
                                                onPageChange={() => { }}
                                                prevPageUrl={
                                                    questions.prev_page_url
                                                }
                                                nextPageUrl={
                                                    questions.next_page_url
                                                }
                                                onUrlChange={goToPage}
                                                buildUrl={(page) => {
                                                    const params =
                                                        new URLSearchParams();
                                                    if (
                                                        activeTab &&
                                                        activeTab !== "all"
                                                    ) {
                                                        params.set(
                                                            "tab",
                                                            activeTab
                                                        );
                                                    }
                                                    if (search) {
                                                        params.set(
                                                            "search",
                                                            search
                                                        );
                                                    }
                                                    if (selectedSubjectId) {
                                                        params.set(
                                                            "subject_id",
                                                            selectedSubjectId.toString()
                                                        );
                                                    }
                                                    if (selectedTagIds.length > 0) {
                                                        selectedTagIds.forEach((tagId) => {
                                                            params.append("tag_id", tagId.toString());
                                                        });
                                                    }
                                                    params.set(
                                                        "page",
                                                        page.toString()
                                                    );
                                                    return `/admin/questions?${params.toString()}`;
                                                }}
                                            />
                                        )}
                                    {questions && (
                                        <div className="text-center mt-4 text-sm text-muted-foreground">
                                            Total:{" "}
                                            {questions.total ||
                                                questions.data.length}{" "}
                                            question(s)
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="my-review">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={
                                                            selectAllMode ||
                                                            (questions.data
                                                                .length > 0 &&
                                                                selectedIds.size ===
                                                                questions
                                                                    .data
                                                                    .length)
                                                        }
                                                        onCheckedChange={
                                                            toggleSelectAll
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-16">
                                                    ID
                                                </TableHead>
                                                <TableHead>
                                                    Question Text
                                                </TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>
                                                    Created By
                                                </TableHead>
                                                {activeTab !== "my-review" && (
                                                    <TableHead>
                                                        Assigned To
                                                    </TableHead>
                                                )}
                                                <TableHead>State</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {renderQuestionsTable(questions)}
                                        </TableBody>
                                    </Table>

                                    {questions &&
                                        (questions.last_page > 1 ||
                                            questions.current_page > 1) &&
                                        !(
                                            questions.current_page === 1 &&
                                            questions.data.length === 0
                                        ) && (
                                            <SmartPagination
                                                currentPage={
                                                    questions.current_page
                                                }
                                                totalPages={questions.last_page}
                                                onPageChange={() => { }}
                                                prevPageUrl={
                                                    questions.prev_page_url
                                                }
                                                nextPageUrl={
                                                    questions.next_page_url
                                                }
                                                onUrlChange={goToPage}
                                                buildUrl={(page) => {
                                                    const params =
                                                        new URLSearchParams();
                                                    if (
                                                        activeTab &&
                                                        activeTab !== "all"
                                                    ) {
                                                        params.set(
                                                            "tab",
                                                            activeTab
                                                        );
                                                    }
                                                    if (search) {
                                                        params.set(
                                                            "search",
                                                            search
                                                        );
                                                    }
                                                    if (selectedSubjectId) {
                                                        params.set(
                                                            "subject_id",
                                                            selectedSubjectId.toString()
                                                        );
                                                    }
                                                    if (selectedTagIds.length > 0) {
                                                        selectedTagIds.forEach((tagId) => {
                                                            params.append("tag_id", tagId.toString());
                                                        });
                                                    }
                                                    params.set(
                                                        "page",
                                                        page.toString()
                                                    );
                                                    return `/admin/questions?${params.toString()}`;
                                                }}
                                            />
                                        )}
                                    {questions && (
                                        <div className="text-center mt-4 text-sm text-muted-foreground">
                                            Total:{" "}
                                            {questions.total ||
                                                questions.data.length}{" "}
                                            question(s)
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                <ImportQuestionsDialog
                    open={importDialogOpen}
                    onOpenChange={setImportDialogOpen}
                />

                <DeleteQuestionDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    question={selectedQuestion}
                    onSuccess={handleDeleteSuccess}
                />
            </div>
        </AdminLayout>
    );
}
