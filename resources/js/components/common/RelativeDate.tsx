import * as React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelativeDateProps {
    date: string | Date;
    className?: string;
}

export function RelativeDate({ date, className }: RelativeDateProps) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const fullDate = dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const relativeTime = React.useMemo(() => {
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - dateObj.getTime()) / 1000
        );

        if (diffInSeconds < 60) {
            return "just now";
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""} ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
        }

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
    }, [dateObj]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={className}>{relativeTime}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{fullDate}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
