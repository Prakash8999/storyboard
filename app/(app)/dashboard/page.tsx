"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, LayoutTemplate, BookText, Trash2, AlertTriangle } from "lucide-react";
import { RulesTab } from "@/components/RulesTab";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";

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
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    // URL State Management
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Derive initial tab from URL or default to 'projects'
    const currentTab = searchParams.get('tab');
    const activeTab = (currentTab === 'rules' ? 'rules' : 'projects') as 'projects' | 'rules';

    const setActiveTab = (tab: 'projects' | 'rules') => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
    };

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

    const confirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            await deleteDoc(doc(db, "projects", projectToDelete.id));
            setProjectToDelete(null);
        } catch (error) {
            console.error("Error deleting project:", error);
            // Optional: Show toast error here
        }
    };

    return (
        <div className="space-y-8 h-full">
            {/* Header & Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your video projects and production rules.</p>
                </div>

                <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/50">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            activeTab === 'projects'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <LayoutTemplate className="w-4 h-4" />
                        Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            activeTab === 'rules'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <BookText className="w-4 h-4" />
                        Rules Library
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {activeTab === 'projects' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
                            <CreateProjectDialog />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-12 animate-pulse text-muted-foreground">Loading projects...</div>
                        ) : projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-muted/20">
                                <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                                <p className="mb-4 text-muted-foreground text-sm max-w-sm">Create your first video project to start scriptwriting and storyboarding.</p>
                                <CreateProjectDialog />
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <Link key={project.id} href={`/project/${project.id}`} className="block h-full">
                                        <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group rounded-xl overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/10 flex flex-col justify-between">
                                            <CardHeader>
                                                <div className="flex justify-between items-start gap-2">
                                                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors text-lg">{project.title}</CardTitle>
                                                    <Badge variant={project.status as any} className="uppercase text-[10px] tracking-wider">{project.status}</Badge>
                                                </div>
                                                <CardDescription className="line-clamp-2 min-h-[40px]">{project.logline || "No logline"}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="text-xs text-muted-foreground flex items-center justify-between border-t p-4 bg-muted/20 mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Updated {project.updatedAt?.toDate?.().toLocaleDateString() || "Recently"}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setProjectToDelete(project);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <RulesTab />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                title="Delete Project"
            >
                <div>
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">Delete "{projectToDelete?.title}"?</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            This action cannot be undone. This will permanently delete the project and all associated scripts and storyboards.
                        </p>

                        <div className="flex items-center gap-3 w-full">
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setProjectToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Delete Project
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
