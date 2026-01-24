import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tag {
    id: number;
    tag_text: string;
}

interface TagBadgeProps {
    tag: Tag;
    className?: string;
}

// Generate distinct colors for tags based on tag ID
const getTagColor = (tagId: number): string => {
    // Use a variety of distinct colors
    const colors = [
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    ];

    return colors[tagId % colors.length];
};

export function TagBadge({ tag, className }: TagBadgeProps) {
    const colorClass = getTagColor(tag.id);

    return (
        <Badge
            className={cn(
                "text-xs px-1.5 py-0.5 font-normal",
                colorClass,
                className
            )}
        >
            {tag.tag_text}
        </Badge>
    );
}
