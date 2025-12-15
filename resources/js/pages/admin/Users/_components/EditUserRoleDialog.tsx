import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    roles: Role[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
}

export function EditUserRoleDialog({ open, onOpenChange, user }: Props) {
    const [role, setRole] = useState("");

    useEffect(() => {
        if (user?.roles?.length) {
            setRole(user.roles[0].name);
        }
    }, [user]);

    const submit = () => {
        if (!user) return;

        router.put(
            `/admin/users/${user.id}/role`,
            { role },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User Role</DialogTitle>
                    <DialogDescription>
                        Select the role assigned to this user.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={submit}
                        className="w-full"
                        disabled={!user || !role}
                    >
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
