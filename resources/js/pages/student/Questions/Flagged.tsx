import { Head, router } from "@inertiajs/react";
import StudentLayout from "@/layouts/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartPagination } from "@/components/common/SmartPagination";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { TagBadge } from "@/components/common/TagBadge";
import { useState } from "react";
import {
    ArrowLeft,
    Flag,
    Eye,
    EyeOff,
    X,
    CheckCircle2,
    XCircle,
    Circle,
} from "lucide-react";
import { route } from "ziggy-js";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Option {
    id: number;
    option_text: string;
    is_correct: boolean | number;
}

interface Question {
    id: number;
    question_text: string;
    subject: Subject | null;
    tags?: Tag[];
    options: Option[];
    selected_option_id: number | null;
    is_correct: boolean | null;
    explanations?: Record<string, string>;
}

interface Props {
    questions: {
        data: Question[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    subjects: Subject[];
    filters: {
        subject_id?: string;
    };
}

export default function FlaggedQuestions({
    questions,
    subjects,
    filters,
}: Props) {
    const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(
        new Set(),
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
        filters.subject_id || "all",
    );

    const toggleReveal = (questionId: number) => {
        setRevealedQuestions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) newSet.delete(questionId);
            else newSet.add(questionId);
            return newSet;
        });
    };

    const handleUnflag = (questionId: number) => {
        router.delete(route("student.questions.unflag", questionId), {
            preserveScroll: true,
        });
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, { preserveState: true, preserveScroll: true });
        }
    };

    const handleSubjectFilter = (subjectId: string | number | null) => {
        const subjectIdStr =
            subjectId === null || subjectId === "all" ? "all" : String(subjectId);
        setSelectedSubjectId(subjectIdStr);

        const params: Record<string, string> = {};
        if (subjectIdStr !== "all") {
            params.subject_id = subjectIdStr;
        }

        router.get(route("student.questions.flagged"), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <StudentLayout title="Flagged Questions">
            <Head title="Flagged Questions" />
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Flag className="h-8 w-8 text-yellow-500" />
                                Flagged Questions
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Review questions you've flagged for later study
                            </p>
                        </div>
                        {questions.total > 0 && (
                            <Badge
                                variant="outline"
                                className="text-lg px-4 py-2"
                            >
                                {questions.total} question
                                {questions.total !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Subject Filter Badges */}
                {subjects.length > 0 && (
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant={
                                    selectedSubjectId === "all"
                                        ? "default"
                                        : "outline"
                                }
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => handleSubjectFilter("all")}
                            >
                                All
                            </Badge>
                            {subjects.map((subject) => (
                                <Badge
                                    key={subject.id}
                                    variant={
                                        selectedSubjectId === String(subject.id)
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() =>
                                        handleSubjectFilter(subject.id)
                                    }
                                >
                                    {subject.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {questions.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                                No flagged questions yet
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Flag questions during quizzes or reviews to save
                                them here for later study.
                            </p>
                            <Button
                                onClick={() =>
                                    router.visit(route("student.dashboard"))
                                }
                            >
                                Go to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            {questions.data.map((question, qIndex) => {
                                const isRevealed = revealedQuestions.has(
                                    question.id,
                                );
                                return (
                                    <Card key={question.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-1.5 mb-2">
                                                        {question.subject && (
                                                            <SubjectBadge
                                                                subject={
                                                                    question.subject
                                                                }
                                                            />
                                                        )}
                                                        {question.tags && question.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {question.tags.map((tag) => (
                                                                    <TagBadge key={tag.id} tag={tag} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-lg">
                                                        Q
                                                        {questions.from +
                                                            qIndex}
                                                        .{" "}
                                                        {question.question_text}
                                                    </CardTitle>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleUnflag(
                                                            question.id,
                                                        )
                                                    }
                                                    className="text-yellow-500"
                                                >
                                                    <Flag className="h-4 w-4 fill-current" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Options */}
                                            <div className="space-y-2">
                                                {question.options.map(
                                                    (option) => {
                                                        const isSelected =
                                                            option.id ===
                                                            question.selected_option_id;
                                                        const isCorrectOption =
                                                            option.is_correct ===
                                                            true ||
                                                            option.is_correct ===
                                                            1;
                                                        const studentAnswered =
                                                            question.selected_option_id !==
                                                            null;

                                                        let bgClass =
                                                            "bg-background border-border";
                                                        let textClass =
                                                            "text-muted-foreground";
                                                        let IconComponent =
                                                            Circle;

                                                        if (isRevealed) {
                                                            if (studentAnswered) {
                                                                // Student answered - show check/X based on selection
                                                                if (
                                                                    isSelected &&
                                                                    isCorrectOption
                                                                ) {
                                                                    textClass =
                                                                        "text-green-600";
                                                                    IconComponent =
                                                                        CheckCircle2;
                                                                } else if (
                                                                    isSelected &&
                                                                    !isCorrectOption
                                                                ) {
                                                                    textClass =
                                                                        "text-red-600";
                                                                    IconComponent =
                                                                        XCircle;
                                                                } else if (
                                                                    isCorrectOption
                                                                ) {
                                                                    // Correct answer but not selected
                                                                    textClass =
                                                                        "text-green-600";
                                                                    IconComponent =
                                                                        Circle;
                                                                }
                                                            } else {
                                                                // Student didn't answer - only show color for correct option
                                                                if (
                                                                    isCorrectOption
                                                                ) {
                                                                    textClass =
                                                                        "text-green-600";
                                                                }
                                                                IconComponent =
                                                                    Circle;
                                                            }
                                                        }

                                                        return (
                                                            <div
                                                                key={option.id}
                                                                className={`p-3 rounded-md border ${bgClass}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <IconComponent
                                                                        className={`h-5 w-5 ${textClass}`}
                                                                    />
                                                                    <span
                                                                        className={`text-sm font-medium ${textClass}`}
                                                                    >
                                                                        {
                                                                            option.option_text
                                                                        }
                                                                    </span>
                                                                    {isRevealed &&
                                                                        !isSelected &&
                                                                        isCorrectOption &&
                                                                        studentAnswered && (
                                                                            <Badge className="bg-green-500 text-white ml-2">
                                                                                Correct
                                                                            </Badge>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>

                                            {/* Reveal/Hide Answer */}
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        toggleReveal(
                                                            question.id,
                                                        )
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    {isRevealed ? (
                                                        <>
                                                            <EyeOff className="h-4 w-4" />{" "}
                                                            Hide Answer
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="h-4 w-4" />{" "}
                                                            Reveal Answer
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Explanation */}
                                            {isRevealed &&
                                                question.explanations &&
                                                Object.keys(
                                                    question.explanations,
                                                ).length > 0 && (
                                                    <div className="pt-4 border-t space-y-2">
                                                        <h4 className="font-semibold text-sm">
                                                            Explanation:
                                                        </h4>
                                                        {Object.entries(
                                                            question.explanations,
                                                        ).map(
                                                            ([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md"
                                                                >
                                                                    <strong className="text-foreground">
                                                                        {key}
                                                                    </strong>
                                                                    : {value}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <SmartPagination
                            currentPage={questions.current_page}
                            totalPages={questions.last_page}
                            onPageChange={(page) => {
                                const url = questions.links.find(
                                    (link) =>
                                        link.label === String(page) && link.url,
                                )?.url;
                                if (url) handlePageChange(url);
                            }}
                            prevPageUrl={questions.prev_page_url}
                            nextPageUrl={questions.next_page_url}
                            onUrlChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </StudentLayout>
    );
}
