import { useForm, router, usePage } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/input-error";
import { toast } from "sonner";
import { QuickCreateTagDialog } from "./QuickCreateTagDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Option {
    id?: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    subject_id: number;
    question_text: string;
    state?: string;
    assigned_to?: number;
    explanations?: {
        correct?: string;
        wrong?: string;
        option1?: string;
        option2?: string;
        option3?: string;
        option4?: string;
        option5?: string;
    };
    tags?: Tag[];
    options?: Option[];
}

interface QuestionFormProps {
    question?: Question | null;
    subjects: Subject[];
    tags: Tag[];
}

export function QuestionForm({
    question,
    subjects,
    tags: initialTags,
}: QuestionFormProps) {
    const isEditMode = !!question;
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;
    const [quickCreateTagOpen, setQuickCreateTagOpen] = useState(false);
    const [tags, setTags] = useState(initialTags);

    // Check if user can approve (question is under-review and assigned to user or user is admin)
    const canApprove =
        isEditMode &&
        question &&
        question.state === "under-review" &&
        currentUser &&
        (currentUser.roles?.includes("admin") ||
            question.assigned_to === currentUser.id);

    const getInitialOptions = (): Option[] => {
        if (question?.options && question.options.length > 0) {
            return question.options.map((opt) => ({
                id: opt.id,
                option_text: opt.option_text,
                is_correct: Boolean(opt.is_correct),
            }));
        }
        return [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
        ];
    };

    const form = useForm({
        subject_id: question?.subject_id ? String(question.subject_id) : "",
        question_text: question?.question_text || "",
        tag_ids: (question?.tags?.map((tag) => tag.id) || []) as number[],
        options: getInitialOptions() as Option[],
        explanations: question?.explanations || {
            correct: "",
            wrong: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            option5: "",
        },
    });

    useEffect(() => {
        setTags(initialTags);
    }, [initialTags]);

    const handleSubmit = (e: React.FormEvent, approve: boolean = false) => {
        e.preventDefault();
        if (isEditMode) {
            if (!question) return;

            // Prepare data with optional approve flag
            const submitData: any = { ...form.data };
            if (approve) {
                submitData.approve = true;
            }

            // Use router.post directly to have full control over the data
            router.post(
                route("admin.questions.update", question.id),
                submitData,
                {
                    onSuccess: () => {
                        toast.success(
                            approve
                                ? "Question updated and approved successfully"
                                : "Question updated successfully"
                        );
                        router.visit(route("admin.questions.index"));
                    },
                    onError: (errors) => {
                        // Set form errors if validation fails
                        Object.keys(errors).forEach((key) => {
                            form.setError(key as any, errors[key]);
                        });
                        toast.error("Please fix the errors in the form");
                    },
                }
            );
        } else {
            form.post(route("admin.questions.create"), {
                onSuccess: () => {
                    toast.success("Question created successfully");
                    router.visit(route("admin.questions.index"));
                },
                onError: () => {
                    toast.error("Please fix the errors in the form");
                },
            });
        }
    };

    const handleReset = () => {
        if (question) {
            form.setData({
                subject_id: String(question.subject_id),
                question_text: question.question_text,
                tag_ids: question.tags?.map((tag) => tag.id) || [],
                options: getInitialOptions(),
                explanations: question.explanations || {
                    correct: "",
                    wrong: "",
                    option1: "",
                    option2: "",
                    option3: "",
                    option4: "",
                    option5: "",
                },
            });
        } else {
            form.reset();
            form.setData("options", [
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
            ]);
            form.setData("explanations", {
                correct: "",
                wrong: "",
                option1: "",
                option2: "",
                option3: "",
                option4: "",
                option5: "",
            });
        }
        form.clearErrors();
    };

    const toggleTag = (tagId: number) => {
        const currentTagIds = form.data.tag_ids;
        if (currentTagIds.includes(tagId)) {
            form.setData(
                "tag_ids",
                currentTagIds.filter((id) => id !== tagId)
            );
        } else {
            form.setData("tag_ids", [...currentTagIds, tagId]);
        }
    };

    const sortedTags = useMemo(() => {
        const selected = tags.filter((tag) =>
            form.data.tag_ids.includes(tag.id)
        );
        const unselected = tags.filter(
            (tag) => !form.data.tag_ids.includes(tag.id)
        );
        return [...selected, ...unselected];
    }, [tags, form.data.tag_ids]);

    const updateOption = (
        index: number,
        field: "option_text" | "is_correct",
        value: string | boolean
    ) => {
        const newOptions = [...form.data.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        form.setData("options", newOptions);
    };

    const toggleCorrectOption = (index: number) => {
        const newOptions = [...form.data.options];
        newOptions.forEach((opt, i) => {
            opt.is_correct = i === index;
        });
        form.setData("options", newOptions);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject_id">Subject</Label>
                        <Select
                            value={form.data.subject_id}
                            onValueChange={(value) =>
                                form.setData("subject_id", value)
                            }
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
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
                        <InputError message={form.errors.subject_id} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="question_text">Question Text</Label>
                    <Textarea
                        id="question_text"
                        value={form.data.question_text}
                        onChange={(e) =>
                            form.setData("question_text", e.target.value)
                        }
                        required
                        rows={4}
                        placeholder="Enter your question here..."
                    />
                    <InputError message={form.errors.question_text} />
                </div>

                <div className="grid gap-4">
                    <Label>Options (Select the correct answer)</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {form.data.options.map((option, index) => (
                            <div key={index} className="grid gap-2">
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id={`option-correct-${index}`}
                                        checked={option.is_correct}
                                        onCheckedChange={() =>
                                            toggleCorrectOption(index)
                                        }
                                        className="mt-2"
                                    />
                                    <div className="flex-1 grid gap-1">
                                        <Label
                                            htmlFor={`option-${index}`}
                                            className="text-sm font-normal"
                                        >
                                            Option {index + 1}
                                            {option.is_correct && (
                                                <span className="ml-2 text-green-600 font-semibold">
                                                    (Correct)
                                                </span>
                                            )}
                                        </Label>
                                        <Textarea
                                            id={`option-${index}`}
                                            value={option.option_text}
                                            onChange={(e) =>
                                                updateOption(
                                                    index,
                                                    "option_text",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            rows={2}
                                            placeholder={`Enter option ${
                                                index + 1
                                            } text...`}
                                        />
                                    </div>
                                </div>
                                {form.errors[
                                    `options.${index}.option_text`
                                ] && (
                                    <InputError
                                        message={
                                            form.errors[
                                                `options.${index}.option_text`
                                            ]
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    {form.errors.options && (
                        <InputError message={form.errors.options} />
                    )}
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Tags (Optional)</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setQuickCreateTagOpen(true)}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Tag
                        </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                        {sortedTags.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No tags available. Click "Create Tag" to add
                                one.
                            </p>
                        ) : (
                            sortedTags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`tag-${tag.id}`}
                                        checked={form.data.tag_ids.includes(
                                            tag.id
                                        )}
                                        onCheckedChange={() =>
                                            toggleTag(tag.id)
                                        }
                                    />
                                    <Label
                                        htmlFor={`tag-${tag.id}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {tag.tag_text}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                    <InputError message={form.errors.tag_ids} />
                </div>

                <div className="grid gap-4">
                    <Label className="text-base font-semibold">
                        Explanations (Optional)
                    </Label>
                    <div className="grid gap-4">
                        <div>
                            <Label
                                htmlFor="explanation-correct"
                                className="text-sm"
                            >
                                Correct Answer Explanation
                            </Label>
                            <Textarea
                                id="explanation-correct"
                                value={form.data.explanations.correct || ""}
                                onChange={(e) =>
                                    form.setData("explanations", {
                                        ...form.data.explanations,
                                        correct: e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="Explain why the correct answer is right..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="explanation-wrong"
                                className="text-sm"
                            >
                                Wrong Answer Fallback (Optional)
                            </Label>
                            <Textarea
                                id="explanation-wrong"
                                value={form.data.explanations.wrong || ""}
                                onChange={(e) =>
                                    form.setData("explanations", {
                                        ...form.data.explanations,
                                        wrong: e.target.value,
                                    })
                                }
                                rows={2}
                                placeholder="General explanation for wrong answers (used if specific option explanation is not provided)..."
                                className="mt-1"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label className="text-sm font-medium">
                                Option-Specific Explanations (Optional)
                            </Label>
                            {form.data.options.map((option, index) => (
                                <div key={index}>
                                    <Label
                                        htmlFor={`explanation-option-${
                                            index + 1
                                        }`}
                                        className="text-xs text-muted-foreground"
                                    >
                                        Explanation for Option {index + 1}
                                        {option.is_correct && (
                                            <span className="ml-1 text-green-600">
                                                (Correct)
                                            </span>
                                        )}
                                    </Label>
                                    <Textarea
                                        id={`explanation-option-${index + 1}`}
                                        value={
                                            form.data.explanations[
                                                `option${
                                                    index + 1
                                                }` as keyof typeof form.data.explanations
                                            ] || ""
                                        }
                                        onChange={(e) =>
                                            form.setData("explanations", {
                                                ...form.data.explanations,
                                                [`option${index + 1}`]:
                                                    e.target.value,
                                            })
                                        }
                                        rows={2}
                                        placeholder={`Why option ${
                                            index + 1
                                        } is ${
                                            option.is_correct
                                                ? "correct"
                                                : "wrong"
                                        }...`}
                                        className="mt-1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={form.processing}
                    >
                        Reset
                    </Button>
                    {canApprove && (
                        <Button
                            type="button"
                            variant="default"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={form.processing}
                        >
                            {form.processing ? "Saving..." : "Save and Approve"}
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={form.processing}
                        variant={canApprove ? "outline" : "default"}
                    >
                        {form.processing
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                            ? "Save as Draft"
                            : "Create Question"}
                    </Button>
                </div>
            </form>

            <QuickCreateTagDialog
                open={quickCreateTagOpen}
                onOpenChange={setQuickCreateTagOpen}
                onTagCreated={(newTag) => {
                    setTags((prevTags) => {
                        if (prevTags.some((t) => t.id === newTag.id)) {
                            return prevTags;
                        }
                        return [...prevTags, newTag];
                    });
                    form.setData("tag_ids", [...form.data.tag_ids, newTag.id]);
                }}
            />
        </>
    );
}
