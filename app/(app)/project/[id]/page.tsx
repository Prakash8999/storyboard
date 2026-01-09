"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/project/ScriptEditor";
import { SceneList } from "@/components/project/SceneList";
import { ShotList } from "@/components/project/ShotList";
import { ProjectIdea } from "@/components/project/ProjectIdea";
import { StoryboardGrid } from "@/components/project/StoryboardGrid";
import { ArrowLeft, LayoutGrid, List, PanelLeft, Columns, BookText, Clapperboard } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function ProjectPage() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [view, setView] = useState<'workspace' | 'storyboard'>('workspace');
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

    // Panel Visibility State
    const [visiblePanels, setVisiblePanels] = useState<string[]>(['idea', 'script', 'scenes']);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = onSnapshot(doc(db, "projects", id as string), (doc) => {
            if (doc.exists()) {
                setProject({ id: doc.id, ...doc.data() });
            }
        });
        return () => unsubscribe();
    }, [id]);

    if (!project) return <div className="flex h-screen items-center justify-center animate-pulse">Loading Workspace...</div>;

    const showIdea = visiblePanels.includes('idea');
    const showScript = visiblePanels.includes('script');
    const showScenes = visiblePanels.includes('scenes');

    // Dynamic grid template columns
    const getGridTemplate = () => {
        let parts = [];
        if (showIdea) parts.push("minmax(300px, 1fr)");
        if (showScript) parts.push("minmax(400px, 1.5fr)");
        if (showScenes) parts.push("minmax(350px, 1.2fr)");
        // Fallback if nothing selected (should prevent empty state but good safety)
        if (parts.length === 0) return "1fr";
        return parts.join(" ");
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between py-2 border-b mb-2 px-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                    <div>
                        <h1 className="text-base md:text-lg font-bold flex items-center gap-2 truncate max-w-[150px] md:max-w-none">
                            {project.title}
                        </h1>
                    </div>
                </div>

                {/* View Toggles */}
                {view === 'workspace' && (
                    <div className="flex-1 flex justify-center order-3 md:order-2 w-full md:w-auto">
                        <ToggleGroup type="multiple" value={visiblePanels} onValueChange={(val) => { if (val.length > 0) setVisiblePanels(val) }} className="bg-muted/30 p-1 rounded-lg border gap-1">
                            <ToggleGroupItem value="idea" aria-label="Toggle Idea" className="px-3 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 dark:data-[state=on]:bg-blue-900/30 dark:data-[state=on]:text-blue-300 shadow-none hover:bg-muted/50 transition-all border border-transparent data-[state=on]:border-blue-200 dark:data-[state=on]:border-blue-800">
                                <PanelLeft className="h-4 w-4 mr-2" /> Idea
                            </ToggleGroupItem>
                            <ToggleGroupItem value="script" aria-label="Toggle Script" className="px-3 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 dark:data-[state=on]:bg-blue-900/30 dark:data-[state=on]:text-blue-300 shadow-none hover:bg-muted/50 transition-all border border-transparent data-[state=on]:border-blue-200 dark:data-[state=on]:border-blue-800">
                                <BookText className="h-4 w-4 mr-2" /> Script
                            </ToggleGroupItem>
                            <ToggleGroupItem value="scenes" aria-label="Toggle Scenes" className="px-3 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 dark:data-[state=on]:bg-blue-900/30 dark:data-[state=on]:text-blue-300 shadow-none hover:bg-muted/50 transition-all border border-transparent data-[state=on]:border-blue-200 dark:data-[state=on]:border-blue-800">
                                <Clapperboard className="h-4 w-4 mr-2" /> Scenes
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0 order-2 md:order-3">
                    <Button variant={view === 'workspace' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('workspace')} className="gap-2 h-8 text-xs px-2 md:px-4">
                        <Columns className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden md:inline">Workspace</span>
                    </Button>
                    <Button variant={view === 'storyboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('storyboard')} className="gap-2 h-8 text-xs px-2 md:px-4">
                        <LayoutGrid className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden md:inline">Storyboard</span>
                    </Button>
                </div>
            </div>

            {view === 'workspace' ? (
                <div className="flex-1 flex flex-col min-h-0 bg-muted/10 relative overflow-hidden p-4">
                    <div
                        className="flex-1 grid gap-6 h-full w-full overflow-hidden"
                        style={{
                            gridTemplateColumns: getGridTemplate(),
                            display: 'grid'
                        }}
                    >
                        {/* Col 1: Idea */}
                        {showIdea && (
                            <div className="border rounded-xl shadow-sm overflow-hidden bg-background h-full min-w-0 flex flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <ProjectIdea project={project} />
                                </div>
                            </div>
                        )}

                        {/* Col 2: Script */}
                        {showScript && (
                            <div className="border rounded-xl shadow-sm overflow-hidden bg-background h-full min-w-0 flex flex-col">
                                <div className="flex-1 overflow-y-auto px-0">
                                    <ScriptEditor projectId={id as string} />
                                </div>
                            </div>
                        )}

                        {/* Col 3: Scenes + Details */}
                        {showScenes && (
                            <div className="border rounded-xl shadow-sm overflow-hidden bg-background h-full min-w-0 flex flex-col">
                                {!activeSceneId ? (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-none p-2 border-b bg-background">
                                            <h3 className="font-semibold text-sm">All Scenes</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <SceneList projectId={id as string} activeSceneId={activeSceneId} onSelectScene={setActiveSceneId} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-none p-2 border-b bg-background flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setActiveSceneId(null)}>
                                                <ArrowLeft className="h-4 w-4 mr-1" /> Scenes
                                            </Button>
                                            <span className="text-sm font-medium text-muted-foreground">|</span>
                                            <span className="text-sm truncate font-semibold">Editing Scene</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto bg-background">
                                            <ShotList projectId={id as string} sceneId={activeSceneId} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-muted/10">
                    <StoryboardGrid projectId={id as string} />
                </div>
            )}
        </div>
    );
}
