import { type PropsWithChildren } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { route } from "ziggy-js";
import { usePage } from "@inertiajs/react";
import { User } from "lucide-react";
import { SharedData } from "@/types";

interface StudentLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function StudentLayout({
    children,
    title = "Student Dashboard",
}: StudentLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const isAdminOrTeacher =
        user?.roles?.some((role) => role === "admin" || role === "teacher") ??
        false;

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b bg-card">
                    <div className="container mx-auto flex items-center justify-between px-4 py-4">
                        <Link
                            href={route("student.dashboard")}
                            className="text-2xl font-bold text-primary"
                        >
                            HKMLE Quiz Practice
                        </Link>

                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center gap-2"
                                    >
                                        <User className="h-4 w-4" />
                                        {user?.name ?? "Student"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isAdminOrTeacher && (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={route("admin.dashboard")}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleLogout}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-6">{children}</main>
            </div>
        </>
    );
}
