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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Link2 } from "lucide-react";
import { SmartPagination } from "@/components/common/SmartPagination";

interface Relationship {
    pivot_id: number;
    subject_id: number;
    subject_name: string;
    tag_id: number;
    tag_text: string;
    created_at: string;
    updated_at: string;
}

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Stats {
    total_relationships: number;
    total_subjects: number;
    total_tags: number;
    subjects_with_tags: number;
    tags_with_subjects: number;
    orphaned_subjects: number;
    orphaned_tags: number;
}

interface TopItem {
    id: number;
    name?: string;
    tag_text?: string;
    tag_count?: number;
    subject_count?: number;
}

interface Props {
    relationships: {
        data: Relationship[];
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
    stats: Stats;
    topSubjects: TopItem[];
    topTags: TopItem[];
    filters: {
        search?: string;
        subject_id?: number;
        tag_id?: number;
    };
}

export default function Index({
    relationships,
    subjects,
    tags,
    stats,
    topSubjects,
    topTags,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
        filters.subject_id || null
    );
    const [selectedTagId, setSelectedTagId] = useState<number | null>(
        filters.tag_id || null
    );
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            updateFilters();
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (isMounted) {
            updateFilters();
        }
    }, [selectedSubjectId, selectedTagId]);

    const updateFilters = () => {
        const params: any = {};
        if (search) params.search = search;
        if (selectedSubjectId) params.subject_id = selectedSubjectId;
        if (selectedTagId) params.tag_id = selectedTagId;

        router.get("/admin/tag-subjects", params, {
            preserveState: true,
            replace: true,
        });
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Tag-Subject Relationships" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Tag-Subject Relationships</h1>
                        <p className="text-muted-foreground mt-1">
                            Explore and manage relationships between tags and subjects
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Relationships
                            </CardTitle>
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_relationships}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active connections
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Subjects with Tags
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.subjects_with_tags}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                of {stats.total_subjects} total subjects
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tags with Subjects
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.tags_with_subjects}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                of {stats.total_tags} total tags
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Orphaned Items
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.orphaned_subjects + stats.orphaned_tags}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.orphaned_subjects} subjects, {stats.orphaned_tags}{" "}
                                tags
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Lists */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Subjects by Tag Count</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {topSubjects.length > 0 ? (
                                    topSubjects.map((subject, index) => (
                                        <div
                                            key={subject.id}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    #{index + 1}
                                                </Badge>
                                                <span className="font-medium">
                                                    {subject.name}
                                                </span>
                                            </div>
                                            <Badge variant="secondary">
                                                {subject.tag_count} tags
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No data available
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Tags by Subject Count</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {topTags.length > 0 ? (
                                    topTags.map((tag, index) => (
                                        <div
                                            key={tag.id}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    #{index + 1}
                                                </Badge>
                                                <span className="font-medium">
                                                    {tag.tag_text}
                                                </span>
                                            </div>
                                            <Badge variant="secondary">
                                                {tag.subject_count} subjects
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No data available
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search subjects or tags..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subject">Filter by Subject</Label>
                                <Select
                                    value={
                                        selectedSubjectId
                                            ? String(selectedSubjectId)
                                            : "all"
                                    }
                                    onValueChange={(value) =>
                                        setSelectedSubjectId(
                                            value === "all" ? null : Number(value)
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {subjects.map((subject) => (
                                            <SelectItem
                                                key={subject.id}
                                                value={String(subject.id)}
                                            >
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tag">Filter by Tag</Label>
                                <Select
                                    value={
                                        selectedTagId
                                            ? String(selectedTagId)
                                            : "all"
                                    }
                                    onValueChange={(value) =>
                                        setSelectedTagId(
                                            value === "all" ? null : Number(value)
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All tags" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tags</SelectItem>
                                        {tags.map((tag) => (
                                            <SelectItem
                                                key={tag.id}
                                                value={String(tag.id)}
                                            >
                                                {tag.tag_text}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Relationships Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Relationships ({relationships.total || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {relationships.data.length > 0 ? (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pivot ID</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Tag</TableHead>
                                                <TableHead>Created At</TableHead>
                                                <TableHead>Updated At</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {relationships.data.map((rel) => (
                                                <TableRow key={rel.pivot_id}>
                                                    <TableCell className="font-mono text-sm">
                                                        #{rel.pivot_id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {rel.subject_name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {rel.tag_text}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            rel.created_at
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            rel.updated_at
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4">
                                    <SmartPagination
                                        currentPage={relationships.current_page}
                                        totalPages={relationships.last_page}
                                        onPageChange={() => { }}
                                        prevPageUrl={relationships.prev_page_url}
                                        nextPageUrl={relationships.next_page_url}
                                        onUrlChange={goToPage}
                                        buildUrl={(page) => {
                                            const params = new URLSearchParams();
                                            if (search) {
                                                params.set("search", search);
                                            }
                                            if (selectedSubjectId) {
                                                params.set("subject_id", selectedSubjectId.toString());
                                            }
                                            if (selectedTagId) {
                                                params.set("tag_id", selectedTagId.toString());
                                            }
                                            params.set("page", page.toString());
                                            return `/admin/tag-subjects?${params.toString()}`;
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    No relationships found matching your filters.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
