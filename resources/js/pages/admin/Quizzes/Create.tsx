import * as React from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import InputError from "@/components/input-error";
import { TagCombobox } from "@/components/TagCombobox";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Search, LoaderCircle } from "lucide-react";
import { route } from "ziggy-js";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { handleFormErrors } from "@/lib/utils";

interface Subject {
    id: number;
    name: string;
}

interface Question {
    id: number;
    question_text: string;
    subject_id?: number;
    subject?: {
        id: number;
        name: string;
    };
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Props {
    subjects: Subject[];
    questions: Question[];
}

export default function Create({ subjects, questions }: Props) {
    const form = useForm({
        title: "",
        mode: "by_subject",
        subject_id: "",
        total_questions: "",
        time_limit_minutes: "",
        questions: [] as Array<{ question_id: string; order: number }>,
    });
    function shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    const [filteredQuestions, setFilteredQuestions] =
        React.useState<Question[]>(questions);
    const [selectedSubjects, setSelectedSubjects] = React.useState<number[]>(
        [],
    );
    const [selectedTagIds, setSelectedTagIds] = React.useState<number[]>([]);
    const [availableTags, setAvailableTags] = React.useState<Tag[]>([]);
    const [questionSearch, setQuestionSearch] = React.useState<string>("");
    const [isLoadingQuestions, setIsLoadingQuestions] =
        React.useState<boolean>(false);

    // Fetch tags when subject changes (for by_subject mode)
    React.useEffect(() => {
        if (form.data.mode === "by_subject" && form.data.subject_id) {
            fetch(`/admin/questions/tags-by-subject/${form.data.subject_id}`)
                .then((res) => res.json())
                .then((data: Tag[]) => {
                    setAvailableTags(data);
                    // Clear tag selections that are not available for new subject
                    const validTagIds = data.map((t) => t.id);
                    setSelectedTagIds((prev) =>
                        prev.filter((id) => validTagIds.includes(id)),
                    );
                })
                .catch(() => {
                    setAvailableTags([]);
                });
        } else {
            setAvailableTags([]);
        }
    }, [form.data.subject_id, form.data.mode]);

    // Load questions when subject or tag is selected (for by_subject mode)
    React.useEffect(() => {
        if (form.data.mode === "by_subject") {
            if (form.data.subject_id) {
                setIsLoadingQuestions(true);
                const url = new URL(
                    `/admin/questions/by-subject/${form.data.subject_id}`,
                    window.location.origin,
                );
                if (selectedTagIds.length > 0) {
                    selectedTagIds.forEach((tagId) => {
                        url.searchParams.append("tag_id[]", String(tagId));
                    });
                } else {
                    // Clear tag_id parameter if no tags selected
                    url.searchParams.delete("tag_id");
                }
                fetch(url.toString())
                    .then((res) => res.json())
                    .then((data: Question[]) => {
                        if (!data.length) {
                            toast.error(
                                "This subject has no questions. Please go to the Questions section and assign questions first.",
                            );
                            setFilteredQuestions([]);
                            form.setData("questions", []);
                            setIsLoadingQuestions(false);
                            return;
                        }

                        setFilteredQuestions(data);
                        // Auto-populate all questions for by_subject mode
                        const rows = data.map((q, index) => ({
                            question_id: String(q.id),
                            order: index + 1,
                        }));
                        form.setData("questions", rows);
                        setIsLoadingQuestions(false);
                    })
                    .catch(() => {
                        toast.error(
                            "Failed to fetch questions for this subject.",
                        );
                        setIsLoadingQuestions(false);
                    });
            } else {
                // Clear questions when no subject is selected in by_subject mode
                setFilteredQuestions([]);
                form.setData("questions", []);
                setIsLoadingQuestions(false);
            }
        } else {
            // For mixed_bag mode, use all questions or filtered by selected subjects
            setFilteredQuestions(questions);
            setIsLoadingQuestions(false);
        }
    }, [form.data.subject_id, form.data.mode, selectedTagIds]);

    // Handle randomize mode - clear questions when mode changes
    React.useEffect(() => {
        if (form.data.mode !== "mixed_bag") {
            setFilteredQuestions([]);
            form.setData("questions", []);
        }
    }, [form.data.mode]);

    // Generate random questions handler - backend handles balancing
    const handleGenerate = () => {
        const total = parseInt(form.data.total_questions, 10);
        if (!total || total <= 0) {
            toast.error(
                "Please enter a valid number of questions to randomly select",
            );
            return;
        }

        setIsLoadingQuestions(true);
        // Build URL with subject_ids and total_questions parameters
        const params = new URLSearchParams();
        if (selectedSubjects.length > 0) {
            selectedSubjects.forEach((id) => {
                params.append("subject_ids[]", String(id));
            });
        }
        params.append("total_questions", String(total));

        const url = `${route(
            "admin.questions.bySubjects",
        )}?${params.toString()}`;

        fetch(url)
            .then((res) => res.json())
            .then((data: Question[]) => {
                if (!data.length) {
                    const subjectMsg =
                        selectedSubjects.length > 0
                            ? "Selected subjects have no questions."
                            : "No questions available.";
                    toast.error(subjectMsg);
                    setFilteredQuestions([]);
                    form.setData("questions", []);
                    setIsLoadingQuestions(false);
                    return;
                }
                const shuffledQuestions = shuffleArray(data);

                setFilteredQuestions(shuffledQuestions);

                // Auto-populate all questions for by_subject mode
                const rows = shuffledQuestions.map((q, index) => ({
                    question_id: String(q.id),
                    order: index + 1,
                }));

                form.setData("questions", rows);

                const subjectMsg =
                    selectedSubjects.length > 0
                        ? `from ${selectedSubjects.length} subject(s)`
                        : "from all subjects";
                toast.success(
                    `Randomly selected ${rows.length} questions ${subjectMsg} (balanced distribution)`,
                );
                setIsLoadingQuestions(false);
            })
            .catch(() => {
                toast.error("Failed to fetch questions.");
                setIsLoadingQuestions(false);
            });
    };

    const handleShuffleQuestions = () => {
        const shuffled = shuffleArray(form.data.questions);
        // Reassign order numbers after shuffling
        const rows = shuffled.map((q, index) => ({
            ...q,
            order: index + 1,
        }));
        form.setData("questions", rows);
        toast.success("Questions shuffled!");
    };

    const addRow = () => {
        // Only allow adding rows in by_subject mode
        if (form.data.mode === "by_subject") {
            form.setData("questions", [
                ...form.data.questions,
                { question_id: "", order: form.data.questions.length + 1 },
            ]);
        }
    };

    const removeRow = (index: number) => {
        const updated = [...form.data.questions];
        updated.splice(index, 1);
        form.setData("questions", updated);
    };

    const updateRow = (
        index: number,
        field: string,
        value: string | number,
    ) => {
        const updated = [...form.data.questions];
        updated[index] = { ...updated[index], [field]: value };
        form.setData("questions", updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate based on mode
        if (form.data.mode === "by_subject") {
            if (!form.data.subject_id) {
                toast.error("Please select a subject");
                return;
            }
        } else if (form.data.mode === "mixed_bag") {
            // No need to check selectedSubjects - if empty, it defaults to all subjects
            const total = parseInt(form.data.total_questions, 10);
            if (!total) {
                toast.error(
                    "Please enter the number of questions to randomly select",
                );
                return;
            }
            if (form.data.questions.length !== total) {
                toast.error(
                    `Total questions do not match. Expected: ${total}, Got: ${form.data.questions.length}`,
                );
                return;
            }
        }

        const incomplete = form.data.questions.some((q) => !q.question_id);
        if (incomplete) {
            toast.error("Please select a question for all rows");
            return;
        }

        // For by_subject mode, set total_questions from questions length
        if (form.data.mode === "by_subject") {
            form.setData("total_questions", String(form.data.questions.length));
        }

        form.post(route("admin.quizzes.create"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Quiz created successfully");
                router.visit(route("admin.quizzes.index"));
            },
            onError: () => {
                handleFormErrors(form.errors);
            },
        });
    };

    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Quizzes", href: "/admin/quizzes" },
                { title: "Create Quiz", href: "/admin/quizzes/create" },
            ]}
        >
            <Head title="Create Quiz" />
            <div className="p-6">
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href={route("admin.quizzes.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Quizzes
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={form.data.title}
                                        onChange={(e) =>
                                            form.setData(
                                                "title",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.title} />
                                </div>

                                {/* Mode - Radio buttons */}
                                <div className="grid gap-2">
                                    <Label>Mode</Label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="mode"
                                                value="by_subject"
                                                checked={
                                                    form.data.mode ===
                                                    "by_subject"
                                                }
                                                onChange={(e) => {
                                                    form.setData(
                                                        "mode",
                                                        e.target.value,
                                                    );
                                                    form.setData(
                                                        "total_questions",
                                                        "",
                                                    );
                                                    form.setData(
                                                        "questions",
                                                        [],
                                                    );
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>By Subject</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="mode"
                                                value="mixed_bag"
                                                checked={
                                                    form.data.mode ===
                                                    "mixed_bag"
                                                }
                                                onChange={(e) => {
                                                    form.setData(
                                                        "mode",
                                                        e.target.value,
                                                    );
                                                    form.setData(
                                                        "questions",
                                                        [],
                                                    );
                                                    form.setData(
                                                        "total_questions",
                                                        "",
                                                    );
                                                    if (
                                                        e.target.value ===
                                                        "mixed_bag"
                                                    ) {
                                                        setSelectedSubjects([]);
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>Randomize</span>
                                        </label>
                                    </div>
                                    <InputError message={form.errors.mode} />
                                </div>

                                {/* Time Limit - Optional for all modes */}
                                <div className="grid gap-2">
                                    <Label>
                                        Time Limit (Minutes)
                                        <span className="text-muted-foreground text-sm ml-1">
                                            (Optional)
                                        </span>
                                    </Label>

                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Enter exam duration in minutes (leave empty for no timer)"
                                        value={form.data.time_limit_minutes}
                                        onChange={(e) =>
                                            form.setData(
                                                "time_limit_minutes",
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <InputError
                                        message={form.errors.time_limit_minutes}
                                    />

                                    <p className="text-xs text-muted-foreground">
                                        Leave empty if you do not want a timer
                                        for this quiz.
                                    </p>
                                </div>

                                {/* Subject - Show dropdown for by_subject mode, checkboxes for mixed_bag mode */}
                                {form.data.mode === "by_subject" ? (
                                    <div className="grid gap-2">
                                        <Label>Subject</Label>
                                        <Select
                                            value={form.data.subject_id || ""}
                                            onValueChange={(v) => {
                                                form.setData("subject_id", v);
                                                form.data?.title ||
                                                    form.setData(
                                                        "title",
                                                        `${
                                                            subjects.find(
                                                                (s) =>
                                                                    s.id ===
                                                                    Number(v),
                                                            )?.name
                                                        } Quiz`,
                                                    );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map((s) => (
                                                    <SelectItem
                                                        key={s.id}
                                                        value={String(s.id)}
                                                    >
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={form.errors.subject_id}
                                        />

                                        {/* Tag Filter - Only show when subject is selected */}
                                        {form.data.subject_id && (
                                            <div className="grid gap-2">
                                                <Label>
                                                    Filter by Tag (Optional)
                                                </Label>
                                                <TagCombobox
                                                    tags={availableTags}
                                                    selectedTagIds={
                                                        selectedTagIds
                                                    }
                                                    disabled={
                                                        availableTags.length ===
                                                        0
                                                    }
                                                    onSelectionChange={(
                                                        tagIds,
                                                    ) => {
                                                        setSelectedTagIds(
                                                            tagIds,
                                                        );
                                                    }}
                                                    placeholder="Search tags to filter..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label>
                                            Select Subjects to Randomize From
                                        </Label>
                                        <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                                            {subjects.map((subject) => (
                                                <label
                                                    key={subject.id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                                                >
                                                    <Checkbox
                                                        checked={selectedSubjects.includes(
                                                            subject.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            if (checked) {
                                                                setSelectedSubjects(
                                                                    [
                                                                        ...selectedSubjects,
                                                                        subject.id,
                                                                    ],
                                                                );
                                                            } else {
                                                                setSelectedSubjects(
                                                                    selectedSubjects.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            subject.id,
                                                                    ),
                                                                );
                                                            }
                                                            // Clear questions when subjects change
                                                            form.setData(
                                                                "questions",
                                                                [],
                                                            );
                                                        }}
                                                    />
                                                    <span>{subject.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {selectedSubjects.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                <strong>All subjects</strong>{" "}
                                                will be used by default if none
                                                are selected
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {selectedSubjects.length}{" "}
                                                subject(s) selected
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Total questions - Only show for randomize mode */}
                                {form.data.mode === "mixed_bag" && (
                                    <div className="grid gap-2">
                                        <Label>
                                            Total Questions (to randomly select)
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={
                                                    form.data.total_questions
                                                }
                                                onChange={(e) =>
                                                    form.setData(
                                                        "total_questions",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter number of questions to randomly select"
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleGenerate}
                                                disabled={
                                                    !form.data
                                                        .total_questions ||
                                                    parseInt(
                                                        form.data
                                                            .total_questions,
                                                        10,
                                                    ) <= 0 ||
                                                    isLoadingQuestions
                                                }
                                            >
                                                {isLoadingQuestions ? (
                                                    <>
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    "Generate"
                                                )}
                                            </Button>
                                        </div>
                                        <InputError
                                            message={
                                                form.errors.total_questions
                                            }
                                        />
                                    </div>
                                )}

                                {/* Show inferred total for by_subject mode */}
                                {form.data.mode === "by_subject" &&
                                    form.data.questions.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label className="text-muted-foreground">
                                                Total Questions (inferred from
                                                selected questions)
                                            </Label>
                                            <p className="text-lg font-semibold">
                                                {form.data.questions.length}{" "}
                                                question(s)
                                            </p>
                                        </div>
                                    )}

                                {/* Quiz Questions */}
                                <div className="border rounded-md p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <Label className="text-md font-semibold">
                                            Quiz Questions
                                        </Label>

                                        <div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleShuffleQuestions}
                                                className="m-2"
                                                disabled={
                                                    form.data.questions
                                                        .length === 0
                                                }
                                            >
                                                🔀 Shuffle
                                            </Button>
                                            {form.data.mode === "by_subject" &&
                                                form.data.subject_id && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={addRow}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Question
                                                    </Button>
                                                )}

                                            {form.data.mode === "mixed_bag" &&
                                                form.data.questions.length >
                                                    0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {
                                                            form.data.questions
                                                                .length
                                                        }{" "}
                                                        question(s) randomly
                                                        selected
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                    {form.data.mode === "by_subject" &&
                                        !form.data.subject_id && (
                                            <p className="text-muted-foreground text-center py-4">
                                                Please select a subject first to
                                                add questions
                                            </p>
                                        )}
                                    {isLoadingQuestions && (
                                        <div className="flex items-center justify-center py-8">
                                            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-muted-foreground">
                                                Loading questions...
                                            </span>
                                        </div>
                                    )}
                                    {form.data.questions.length > 0 && (
                                        <div className="mb-3">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search questions..."
                                                    value={questionSearch}
                                                    onChange={(e) =>
                                                        setQuestionSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!isLoadingQuestions && (
                                        <div
                                            className={`space-y-3 max-h-[50vh] overflow-y-auto ${
                                                form.data.mode ===
                                                    "by_subject" &&
                                                !form.data.subject_id
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            {form.data.questions
                                                .map((q, originalIndex) => ({
                                                    question: q,
                                                    originalIndex,
                                                }))
                                                .filter(({ question }) => {
                                                    if (
                                                        !questionSearch.trim()
                                                    ) {
                                                        return true;
                                                    }
                                                    const questionData =
                                                        filteredQuestions.find(
                                                            (ques) =>
                                                                String(
                                                                    ques.id,
                                                                ) ===
                                                                question.question_id,
                                                        );
                                                    return questionData
                                                        ? questionData.question_text
                                                              .toLowerCase()
                                                              .includes(
                                                                  questionSearch.toLowerCase(),
                                                              )
                                                        : false;
                                                })
                                                .map(
                                                    ({
                                                        question: q,
                                                        originalIndex,
                                                    }) => (
                                                        <div
                                                            key={`${q.question_id}-${q.order}-${originalIndex}`}
                                                            className="grid grid-cols-[3fr_1fr_auto] gap-3 items-end"
                                                        >
                                                            <div>
                                                                <Label>
                                                                    Question
                                                                </Label>
                                                                <Select
                                                                    value={
                                                                        q.question_id
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) =>
                                                                        updateRow(
                                                                            originalIndex,
                                                                            "question_id",
                                                                            v,
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select question" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {filteredQuestions
                                                                            .filter(
                                                                                (
                                                                                    ques,
                                                                                ) =>
                                                                                    !form.data.questions.some(
                                                                                        (
                                                                                            q2,
                                                                                            idx,
                                                                                        ) =>
                                                                                            q2.question_id ===
                                                                                                String(
                                                                                                    ques.id,
                                                                                                ) &&
                                                                                            idx !==
                                                                                                originalIndex,
                                                                                    ),
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    ques,
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            ques.id
                                                                                        }
                                                                                        value={String(
                                                                                            ques.id,
                                                                                        )}
                                                                                    >
                                                                                        {
                                                                                            ques.question_text
                                                                                        }
                                                                                    </SelectItem>
                                                                                ),
                                                                            )}
                                                                    </SelectContent>
                                                                </Select>
                                                                {form.data
                                                                    .mode ===
                                                                    "mixed_bag" &&
                                                                    q.question_id &&
                                                                    (() => {
                                                                        const questionData =
                                                                            filteredQuestions.find(
                                                                                (
                                                                                    ques,
                                                                                ) =>
                                                                                    String(
                                                                                        ques.id,
                                                                                    ) ===
                                                                                    q.question_id,
                                                                            );
                                                                        return questionData?.subject ? (
                                                                            <div className="mt-1">
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        questionData
                                                                                            .subject
                                                                                            .name
                                                                                    }
                                                                                </Badge>
                                                                            </div>
                                                                        ) : null;
                                                                    })()}
                                                                <InputError
                                                                    message={
                                                                        form
                                                                            .errors[
                                                                            `questions.${originalIndex}.question_id`
                                                                        ]
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label>
                                                                    Order
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        q.order
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            originalIndex,
                                                                            "order",
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                1,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={
                                                                        form
                                                                            .errors[
                                                                            `questions.${originalIndex}.order`
                                                                        ]
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="w-fit">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeRow(
                                                                            originalIndex,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(
                                                route("admin.quizzes.index"),
                                            )
                                        }
                                        disabled={form.processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing ||
                                            form.data.questions.length === 0
                                        }
                                    >
                                        {form.processing
                                            ? "Creating..."
                                            : "Create Quiz"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
