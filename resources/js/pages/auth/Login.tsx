import { Head, Link } from "@inertiajs/react";
import AuthLayout from "@/layouts/common/AuthLayout";
import { useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import InputError from "@/components/input-error";
import { toast } from "sonner";

export default function Login() {
    const form = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route("login.post"), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.clearErrors();
                toast.success("Logged in successfully");
            },
            onError: () => {
                if (form.errors.email) {
                    toast.error(form.errors.email);
                } else if (form.errors.password) {
                    toast.error(form.errors.password);
                } else {
                    toast.error("Invalid credentials");
                }
            },
        });
    };

    return (
        <>
            <Head title="Login" />
            <AuthLayout>
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">
                            Login
                        </CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData("email", e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                                <InputError message={form.errors.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData("password", e.target.value)
                                    }
                                    required
                                />
                                <InputError message={form.errors.password} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={form.data.remember}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            "remember",
                                            checked === true
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.processing}
                            >
                                {form.processing ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            <Link
                                href={route("register")}
                                className="text-primary hover:underline"
                            >
                                Create a new account
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </AuthLayout>
        </>
    );
}
