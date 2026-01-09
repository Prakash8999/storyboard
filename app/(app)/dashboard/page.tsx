"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

interface Project {
    id: string;
    title: string;
    logline: string;
    status: string;
    updatedAt: any;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "projects"),
            where("userId", "==", user.uid),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Project[];
            setProjects(projectsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center p-12 animate-pulse text-muted-foreground">Loading projects...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                <CreateProjectDialog />
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 bg-muted/20">
                    <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                    <p className="mb-4 text-muted-foreground text-sm max-w-sm">Create your first video project to start scriptwriting and storyboarding.</p>
                    <CreateProjectDialog />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/project/${project.id}`} className="block h-full">
                            <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group rounded-xl overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/10">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors text-lg">{project.title}</CardTitle>
                                        <Badge variant={project.status as any} className="uppercase text-[10px] tracking-wider">{project.status}</Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">{project.logline || "No logline"}</CardDescription>
                                </CardHeader>
                                <CardFooter className="text-xs text-muted-foreground flex gap-2 border-t pt-4 bg-muted/20">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>Updated {project.updatedAt?.toDate?.().toLocaleDateString() || "Recently"}</span>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
