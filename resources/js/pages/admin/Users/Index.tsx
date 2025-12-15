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
import { Plus, Eye, Trash2, Pencil } from "lucide-react";
import { CreateUserDialog } from "./_components/CreateUserDialog";
import { ViewUserDialog } from "./_components/ViewUserDialog";
import { DeleteUserDialog } from "./_components/DeleteUserDialog";
import { EditUserRoleDialog } from "./_components/EditUserRoleDialog";

interface User {
    id: number;
    name: string;
    email: string;
    roles: Array<{ id: number; name: string }>;
}
interface Role {
    id: number;
    name: string;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        roles: Role[];
    };
}

export default function Index({ users, filters }: any) {
    const [search, setSearch] = useState(filters.search || "");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                "/admin/users",
                { search },
                { preserveState: true, replace: true }
            );
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    const goToPage = (url: string | null) => {
        if (url) router.get(url);
    };

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editRoleOpen, setEditRoleOpen] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
        null
    );

    const handleView = (user: User) => {
        setSelectedUser(user);
        setViewDialogOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteSuccess = () => {
        setSelectedUser(null);
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Users", href: "/admin/users" },
            ]}
        >
            <Head title="Users" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Users</CardTitle>
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center"
                                        >
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.id}</TableCell>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {user.roles
                                                    .map((role) => role.name)
                                                    .join(", ") || "No roles"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleView(user)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserForRole(
                                                                user
                                                            );
                                                            setEditRoleOpen(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {!user.roles.some(
                                                        (role) =>
                                                            role.name ===
                                                            "admin"
                                                    ) && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
                                    disabled={!users.prev_page_url}
                                    onClick={() =>
                                        goToPage(users.prev_page_url)
                                    }
                                >
                                    Prev
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const pages = [];
                                    const total = users.last_page;
                                    const current = users.current_page;
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
                                                        `/admin/users?page=${page}`
                                                    )
                                                }
                                                className={`px-3 py-1 rounded border text-sm ${
                                                    users.current_page === page
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
                                    disabled={!users.next_page_url}
                                    onClick={() =>
                                        goToPage(users.next_page_url)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Page-specific dialogs */}
                <EditUserRoleDialog
                    open={editRoleOpen}
                    onOpenChange={setEditRoleOpen}
                    user={selectedUserForRole}
                />
                <CreateUserDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                />
                <ViewUserDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    user={selectedUser}
                />
                <DeleteUserDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    user={selectedUser}
                    onSuccess={handleDeleteSuccess}
                />
            </div>
        </AdminLayout>
    );
}
