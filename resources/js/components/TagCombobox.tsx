import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Tag {
    id: number;
    tag_text: string;
}

interface TagComboboxProps {
    tags: Tag[];
    selectedTagIds: number[];
    onSelectionChange: (tagIds: number[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    multiple?: boolean; // If false, only one tag can be selected (for filtering)
}

export function TagCombobox({
    tags,
    selectedTagIds,
    onSelectionChange,
    placeholder = "Search tags...",
    disabled = false,
    className,
    multiple = true,
}: TagComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Normalize selectedTagIds to always be an array
    const normalizedSelectedIds = React.useMemo(() => {
        if (!selectedTagIds || !Array.isArray(selectedTagIds)) {
            return [];
        }
        return selectedTagIds;
    }, [selectedTagIds]);

    // Filter tags based on search query
    const filteredTags = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return tags;
        }
        const query = searchQuery.toLowerCase();
        return tags.filter((tag) =>
            tag.tag_text.toLowerCase().includes(query)
        );
    }, [tags, searchQuery]);

    // Get selected tags
    const selectedTags = React.useMemo(() => {
        return tags.filter((tag) => normalizedSelectedIds.includes(tag.id));
    }, [tags, normalizedSelectedIds]);

    const toggleTag = (tagId: number, event?: React.MouseEvent) => {
        // Prevent event bubbling to avoid closing dropdown
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const currentIds = normalizedSelectedIds;

        if (currentIds.includes(tagId)) {
            // If already selected, remove it (works for both single and multiple)
            const newIds = currentIds.filter((id) => id !== tagId);
            onSelectionChange(newIds);
        } else {
            if (multiple) {
                // Multiple select mode - add to selection, keep dropdown open
                const newIds = [...currentIds, tagId];
                onSelectionChange(newIds);
            } else {
                // Single select mode - replace selection and close dropdown
                onSelectionChange([tagId]);
                setOpen(false);
            }
        }
    };

    const removeTag = (tagId: number) => {
        const currentIds = normalizedSelectedIds;
        onSelectionChange(currentIds.filter((id) => id !== tagId));
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Input with dropdown trigger */}
            <div className="relative">
                <Input
                    type="text"
                    placeholder={tags.length === 0 ? "No tags available" : searchQuery.trim() ? "Search tags..." : disabled ? "No tags available" : placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    disabled={disabled}
                    className="pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setOpen(!open)}
                    disabled={disabled}
                >
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </Button>
            </div>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="max-h-60 overflow-auto p-1">
                        {filteredTags.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                {tags.length === 0 ? (
                                    <span>No tags available</span>
                                ) : searchQuery.trim() ? (
                                    <span>No tags match "{searchQuery}"</span>
                                ) : (
                                    <span>No tags found</span>
                                )}
                            </div>
                        ) : (
                            filteredTags.map((tag) => {
                                const isSelected = normalizedSelectedIds.includes(
                                    tag.id
                                );
                                return (
                                    <div
                                        key={tag.id}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            isSelected && "bg-accent"
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleTag(tag.id, e);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary mr-2">
                                            {isSelected && (
                                                <Check className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span>{tag.tag_text}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Selected tags as badges */}
            <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => {
                        return (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className={cn(
                                    "pr-1 transition-colors duration-200",
                                    "has-[button:hover]:bg-destructive/90 has-[button:hover]:text-destructive-foreground has-[button:hover]:border-destructive",
                                    !multiple && "cursor-pointer",
                                )}
                                onClick={(e) => {
                                    if (!multiple) {
                                        e.stopPropagation();
                                        removeTag(tag.id);
                                    }
                                }}
                            >
                                {tag.tag_text}
                                {multiple && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTag(tag.id);
                                        }}
                                        className={cn(
                                            "ml-1 rounded-full transition-colors duration-200",
                                            "hover:bg-destructive-foreground/30"
                                        )}
                                        disabled={disabled}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </Badge>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
