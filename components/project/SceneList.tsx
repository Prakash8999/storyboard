"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function SceneList({ projectId, activeSceneId, onSelectScene }: { projectId: string; activeSceneId: string | null; onSelectScene: (id: string) => void }) {
    const [scenes, setScenes] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "projects", projectId, "scenes"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setScenes(docs);
        });
        return () => unsubscribe();
    }, [projectId]);

    const addScene = async () => {
        await addDoc(collection(db, "projects", projectId, "scenes"), {
            title: "",
            order: scenes.length + 1,
            createdAt: serverTimestamp()
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-3 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
                <h3 className="font-semibold text-sm">Scenes</h3>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addScene}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {scenes.map((scene, idx) => (
                    <div
                        key={scene.id}
                        onClick={() => onSelectScene(scene.id)}
                        className={cn(
                            "p-2 rounded-md text-sm cursor-pointer transition-colors flex items-center gap-3 group relative border border-transparent",
                            activeSceneId === scene.id
                                ? "bg-accent/50 text-accent-foreground font-medium border-border/50 shadow-sm"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <span className={cn(
                            "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0",
                            activeSceneId === scene.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            {idx + 1}
                        </span>
                        <span className="truncate flex-1">{scene.title || <span className="italic opacity-50">Untitled Scene</span>}</span>
                    </div>
                ))}
                {scenes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-4 text-xs text-muted-foreground border border-dashed rounded-md m-2">
                        <p>No scenes found.</p>
                        <Button onClick={addScene} className="h-auto p-1 mt-2">  <Plus className="mr-1 h-4 w-4" /> Create one</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
