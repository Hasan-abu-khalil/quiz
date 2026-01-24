import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import {
    LayoutGrid,
    Users,
    BookOpen,
    FileQuestion,
    ClipboardList,
    Tag,
    Book,
    Link2,
} from "lucide-react";
import AppLogo from "./app-logo";

const mainNavItems = [
    {
        title: "Main",
        items: [
            {
                title: "Dashboard",
                href: "/admin",
                icon: LayoutGrid,
            },
            {
                title: "Users",
                href: "/admin/users",
                icon: Users,
                role: ["admin"],
            },
            {
                title: "Subjects",
                href: "/admin/subjects",
                icon: Book,
                role: ["admin", "teacher"],
            },
            {
                title: "Questions",
                href: "/admin/questions",
                icon: FileQuestion,
                role: ["admin", "teacher"],
            },
            {
                title: "Quizzes",
                href: "/admin/quizzes",
                icon: BookOpen,
                role: ["admin", "teacher"],
            },
            {
                title: "Attempts",
                href: "/admin/attempts",
                icon: ClipboardList,
                role: ["admin", "teacher"],
            },
            {
                title: "Tags",
                href: "/admin/tags",
                icon: Tag,
                role: ["admin", "teacher"],
            },
        ],
    },
    {
        title: "Relationships",
        items: [
            {
                title: "Tag-Subject",
                href: "/admin/tag-subjects",
                icon: Link2,
                role: ["admin", "teacher"],
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <AppLogo />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
