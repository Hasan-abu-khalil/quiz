import * as React from "react";
import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { route } from "ziggy-js";
import { RelativeDate } from "@/components/common/RelativeDate";

interface LeaderboardEntry {
    rank: number;
    student_id: number;
    student_name: string;
    score: number;
    total_questions: number;
    percentage: number;
    attempted_at: string;
}

interface Quiz {
    id: number;
    title: string;
    total_questions: number;
    target_student: {
        id: number;
        name: string;
    } | null;
    strategy: string | null;
    subject: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    quiz: Quiz;
    leaderboard: LeaderboardEntry[];
    currentStudentId: number;
}

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400 dark:text-slate-300" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700 dark:text-amber-500" />;
    return null;
};

export default function Leaderboard({
    quiz,
    leaderboard,
    currentStudentId,
}: Props) {
    return (
        <>
            <Head title={`Leaderboard - ${quiz.title}`} />
            <div className="container mx-auto py-8 px-4 max-w-6xl">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() =>
                            router.visit(route("student.quizzes.show", quiz.id))
                        }
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Quiz
                    </Button>
                    <h1 className="text-3xl font-bold">Leaderboard</h1>
                    <p className="text-muted-foreground mt-2">{quiz.title}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Attempts</CardTitle>
                        {quiz.target_student && (
                            <p className="text-sm text-muted-foreground">
                                Created for: {quiz.target_student.name}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">
                                    No attempts yet. Be the first to take this
                                    quiz!
                                </p>
                                <Button
                                    className="mt-4"
                                    onClick={() =>
                                        router.visit(
                                            route("student.quizzes.show", quiz.id)
                                        )
                                    }
                                >
                                    Take Quiz
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">
                                                Rank
                                            </TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead className="text-right">
                                                Score
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Percentage
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Date
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaderboard.map((entry) => {
                                            const isCurrentStudent =
                                                entry.student_id ===
                                                currentStudentId;
                                            return (
                                                <TableRow
                                                    key={`${entry.student_id}-${entry.attempted_at}`}
                                                    className={
                                                        isCurrentStudent
                                                            ? "bg-primary/5 dark:bg-primary/10"
                                                            : ""
                                                    }
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            {getRankIcon(
                                                                entry.rank
                                                            )}
                                                            <span className="font-medium">
                                                                {entry.rank}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <span>
                                                                {entry.student_name}
                                                            </span>
                                                            {isCurrentStudent && (
                                                                <Badge variant="outline">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {entry.score} /{" "}
                                                        {entry.total_questions}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge
                                                            className={
                                                                entry.percentage >= 80
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                    : entry.percentage >= 60
                                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                            }
                                                        >
                                                            {entry.percentage.toFixed(1)}%
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        <RelativeDate
                                                            date={entry.attempted_at}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}



