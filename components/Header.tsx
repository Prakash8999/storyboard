"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";

export function Header() {
    const { user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-14 items-center px-4 md:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <Clapperboard className="h-6 w-6" />
                    <span>Storyboard</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">
                        {user?.email}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
