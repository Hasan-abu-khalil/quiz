import * as React from "react";
import { Button } from "@/components/ui/button";

interface SmartPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPrevNext?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    className?: string;
    // Optional: if provided, will be used to build URLs for page navigation
    buildUrl?: (page: number) => string;
    // Optional: for URL-based navigation (prev/next URLs from Laravel)
    prevPageUrl?: string | null;
    nextPageUrl?: string | null;
    onUrlChange?: (url: string | null) => void;
}

export function SmartPagination({
    currentPage,
    totalPages,
    onPageChange,
    showPrevNext = true,
    prevLabel = "Prev",
    nextLabel = "Next",
    className = "",
    buildUrl,
    prevPageUrl,
    nextPageUrl,
    onUrlChange,
}: SmartPaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    // Calculate which pages to show
    const pages: (number | string)[] = [];

    // Always show page 1
    pages.push(1);

    // Sliding window range
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    if (currentPage <= 3) {
        end = Math.min(6, totalPages - 1);
    }

    if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 5);
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
    if (end < totalPages - 1) {
        pages.push("...");
    }

    // Always show last page (if > 1)
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    const handlePageClick = (page: number) => {
        if (buildUrl && onUrlChange) {
            const url = buildUrl(page);
            onUrlChange(url);
        } else {
            onPageChange(page);
        }
    };

    const handlePrev = () => {
        if (prevPageUrl && onUrlChange) {
            onUrlChange(prevPageUrl);
        } else {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (nextPageUrl && onUrlChange) {
            onUrlChange(nextPageUrl);
        } else {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className={`flex justify-center mt-6 ${className}`}>
            <div className="flex items-center space-x-1 flex-wrap gap-1">
                {showPrevNext && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={
                            prevPageUrl !== undefined
                                ? !prevPageUrl
                                : currentPage === 1
                        }
                        onClick={handlePrev}
                    >
                        {prevLabel}
                    </Button>
                )}

                {pages.map((page, index) => {
                    if (page === "...") {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-muted-foreground"
                            >
                                ...
                            </span>
                        );
                    }

                    const pageNum = page as number;
                    return (
                        <button
                            key={pageNum}
                            onClick={() => handlePageClick(pageNum)}
                            className={`px-3 py-1 rounded border text-sm ${currentPage === pageNum
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100 hover:text-black"
                                }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                {showPrevNext && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={
                            nextPageUrl !== undefined
                                ? !nextPageUrl
                                : currentPage === totalPages
                        }
                        onClick={handleNext}
                    >
                        {nextLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
