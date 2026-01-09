"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading) {
            const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
            if (!user && !isAuthPage && pathname !== "/") {
                // Redirect to login if not authenticated and trying to access protected pages
                // But allow landing page "/" if I decide to have one. 
                // For now, let's assume root is protected or redirects. 
                // The user said: "After login, redirect to your list of projects."
                // "Once logged in, all pages show a minimal header..."
                router.push("/login");
            } else if (user && isAuthPage) {
                router.push("/dashboard");
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
