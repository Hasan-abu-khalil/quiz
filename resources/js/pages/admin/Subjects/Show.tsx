import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/layouts/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";



interface Subject {
    id: number;
    name: string;
   
}

interface Props {
    subject: Subject;
}

export default function Show({ subject }: Props) {
    return (
        <AdminLayout
            breadcrumbs={[
                { title: "Dashboard", href: "/admin" },
                { title: "Subjects", href: "/admin/subjects" },
                {
                    title: `Subject ${subject.id}`,
                    href: `/admin/subjects/${subject.id}`,
                },
            ]}
        >
            <Head title={`Subject: ${subject.name}`} />

            <div className="p-6">
                {/* Back Button */}
                <div className="mb-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin/subjects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Subjects
                        </Link>
                    </Button>
                </div>

                {/* Subject Details */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Subject Details</CardTitle>
                    </CardHeader>

                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">ID</p>
                            <p className="text-lg font-semibold">{subject.id}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="text-lg font-semibold">
                                {subject.name}
                            </p>
                        </div>

                       
                    </CardContent>
                </Card>

              
            </div>
        </AdminLayout>
    );
}
