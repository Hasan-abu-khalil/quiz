import * as React from "react";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/input-error";
import { handleFormErrors } from "@/lib/utils";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { route } from "ziggy-js";
import { TagCombobox } from "@/components/TagCombobox";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Props {
    subjects: Subject[];
    tags: Tag[];
}

export default function Create({ subjects, tags }: Props) {
    const [availableTags, setAvailableTags] = React.useState<Tag[]>(tags);
    const [selectedTagIds, setSelectedTagIds] = React.useState<number[]>([]);

    const form = useForm({
        total_questions: "",
        strategy: "mixed",
        subject_ids: [] as number[],
        tag_ids: [] as number[],
        title: "",
        time_limit_minutes: "",
        is_public: false,
    });

    // Filter tags by selected subjects
    React.useEffect(() => {
        if (form.data.subject_ids.length > 0) {
            // Fetch tags for selected subjects
            const subjectIds = form.data.subject_ids;
            Promise.all(
                subjectIds.map((subjectId) =>
                    fetch(`/student/questions/tags-by-subject/${subjectId}`)
                        .then((res) => {
                            if (!res.ok) {
                                throw new Error(`HTTP error! status: ${res.status}`);
                            }
                            return res.json();
                        })
                        .catch((error) => {
                            console.error(`Error fetching tags for subject ${subjectId}:`, error);
                            return [];
                        })
                )
            )
                .then((results) => {
                    // Combine and deduplicate tags from all selected subjects
                    const allTags = results.flat();
                    const uniqueTags = Array.from(
                        new Map(allTags.map((tag: Tag) => [tag.id, tag])).values()
                    );
                    setAvailableTags(uniqueTags);
                    // Filter selected tags to only include available ones
                    const validTagIds = uniqueTags.map((t) => t.id);
                    setSelectedTagIds((prev) =>
                        prev.filter((id) => validTagIds.includes(id))
                    );
                })
                .catch((error) => {
                    console.error('Error fetching tags:', error);
                    setAvailableTags([]);
                });
        } else {
            // If no subjects selected, show all tags
            setAvailableTags(tags);
        }
    }, [form.data.subject_ids, tags]);

    // Sync selectedTagIds with form
    React.useEffect(() => {
        form.setData("tag_ids", selectedTagIds);
    }, [selectedTagIds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route("student.adaptive.generate"), {
            onError: (errors) => {
                handleFormErrors(errors);
            },
            onSuccess: () => {
                // Redirect happens automatically
            },
        });
    };

    const toggleSubject = (subjectId: number) => {
        const current = form.data.subject_ids;
        if (current.includes(subjectId)) {
            form.setData(
                "subject_ids",
                current.filter((id) => id !== subjectId)
            );
        } else {
            form.setData("subject_ids", [...current, subjectId]);
        }
    };

    const strategyOptions = [
        {
            value: "mixed",
            label: "Random Questions",
            description: "Random selection of questions from selected subjects",
        },
        {
            value: "never_attempted",
            label: "Never Attempted",
            description: "Questions you haven't tried before",
        },
        {
            value: "worst_performing",
            label: "Worst Performing",
            description: "Questions with the lowest overall accuracy rate",
        },
        {
            value: "recently_incorrect",
            label: "Review Incorrect",
            description: "Questions you got wrong previously",
        },
        {
            value: "weak_subjects",
            label: "Weak Subjects",
            description: "Questions from subjects where you perform worst",
        },
    ];

    return (
        <>
            <Head title="Create Adaptive Quiz" />
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.visit(route("student.dashboard"))}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold">Create Adaptive Quiz</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate a personalized quiz based on your performance
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quiz Configuration</CardTitle>
                        <CardDescription>
                            Select your strategy and preferences to generate a
                            personalized adaptive quiz
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Strategy Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="strategy">
                                    Question Selection Strategy *
                                </Label>
                                <Select
                                    value={form.data.strategy}
                                    onValueChange={(value) =>
                                        form.setData("strategy", value)
                                    }
                                >
                                    <SelectTrigger id="strategy">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {strategyOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.strategy}
                                    className="mt-1"
                                />
                                {form.data.strategy && (
                                    <p className="text-sm text-muted-foreground">
                                        {strategyOptions.find(
                                            (opt) =>
                                                opt.value === form.data.strategy
                                        )?.description ||
                                            "Choose how questions should be selected for this quiz"}
                                    </p>
                                )}
                            </div>

                            {/* Total Questions */}
                            <div className="space-y-2">
                                <Label htmlFor="total_questions">
                                    Total Questions *
                                </Label>
                                <Input
                                    id="total_questions"
                                    type="number"
                                    min="1"
                                    value={form.data.total_questions}
                                    onChange={(e) =>
                                        form.setData(
                                            "total_questions",
                                            e.target.value
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.total_questions}
                                    className="mt-1"
                                />
                            </div>

                            {/* Subject Selection */}
                            <div className="space-y-2">
                                <Label>Subjects (Optional)</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Leave empty to include all subjects, or
                                    select specific subjects
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`subject-${subject.id}`}
                                                checked={form.data.subject_ids.includes(
                                                    subject.id
                                                )}
                                                onCheckedChange={() =>
                                                    toggleSubject(subject.id)
                                                }
                                            />
                                            <Label
                                                htmlFor={`subject-${subject.id}`}
                                                className="cursor-pointer font-normal"
                                            >
                                                {subject.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <InputError
                                    message={form.errors.subject_ids}
                                    className="mt-1"
                                />
                            </div>

                            {/* Tag Selection */}
                            <div className="space-y-2">
                                <Label>Tags (Optional)</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Filter questions by specific tags. If subjects are selected, only tags from those subjects will be shown.
                                </p>
                                <TagCombobox
                                    tags={availableTags}
                                    selectedTagIds={selectedTagIds}
                                    onSelectionChange={setSelectedTagIds}
                                    placeholder="Search tags to filter..."
                                />
                                <InputError
                                    message={form.errors.tag_ids}
                                    className="mt-1"
                                />
                            </div>

                            {/* Time Limit */}
                            <div className="space-y-2">
                                <Label htmlFor="time_limit_minutes">
                                    Time Limit (minutes, optional)
                                </Label>
                                <Input
                                    id="time_limit_minutes"
                                    type="number"
                                    min="1"
                                    value={form.data.time_limit_minutes}
                                    onChange={(e) =>
                                        form.setData(
                                            "time_limit_minutes",
                                            e.target.value
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.time_limit_minutes}
                                    className="mt-1"
                                />
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Custom Title (Optional)
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    maxLength={255}
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData("title", e.target.value)
                                    }
                                    placeholder="Leave empty for auto-generated title"
                                />
                                <InputError
                                    message={form.errors.title}
                                    className="mt-1"
                                />
                            </div>

                            {/* Public/Private */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_public"
                                        checked={form.data.is_public}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                "is_public",
                                                checked === true
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="is_public"
                                        className="cursor-pointer font-normal"
                                    >
                                        Make this quiz public
                                    </Label>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Public quizzes appear in Browse for everyone
                                    to take. Private quizzes are only visible to
                                    you in My Challenges.
                                </p>
                                <InputError
                                    message={form.errors.is_public}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(route("student.dashboard"))
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Quiz"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
