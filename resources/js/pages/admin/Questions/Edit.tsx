import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuestionForm } from "./_components/QuestionForm";

interface Subject {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    tag_text: string;
}

interface Question {
    id: number;
    subject_id: number;
    question_text: string;
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
    options?: {
        id?: number;
        option_text: string;
        is_correct: boolean;
    }[];
}

interface Props {
    question: Question;
    subjects: Subject[];
    tags: Tag[];
}

export default function Edit({ question, subjects, tags }: Props) {
    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Questions", href: "/admin/questions" },
                {
                    title: `Edit Question ${question.id}`,
                    href: `/admin/questions/${question.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Question ${question.id}`} />
            <div className="p-6">
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href={route("admin.questions.index")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Questions
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <QuestionForm
                            question={question}
                            subjects={subjects}
                            tags={tags}
                        />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
