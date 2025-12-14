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

interface Props {
    subjects: Subject[];
    tags: Tag[];
}

export default function Create({ subjects, tags }: Props) {
    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Questions", href: "/admin/questions" },
                { title: "Create Question", href: "/admin/questions/create" },
            ]}
        >
            <Head title="Create Question" />
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
                        <CardTitle>Create New Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <QuestionForm
                            question={null}
                            subjects={subjects}
                            tags={tags}
                        />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
