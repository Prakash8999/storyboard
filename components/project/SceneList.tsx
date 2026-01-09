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
        // You generally want to handle scene creation carefully, but this is fine for MVP
        await addDoc(collection(db, "projects", projectId, "scenes"), {
            title: "",
            order: scenes.length + 1,
            createdAt: serverTimestamp()
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-semibold text-sm">Scenes</h3>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addScene}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {scenes.map((scene, idx) => (
                    <div
                        key={scene.id}
                        onClick={() => onSelectScene(scene.id)}
                        className={cn("p-2 rounded-md text-sm cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2 group", activeSceneId === scene.id ? "bg-muted font-medium text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground")}
                    >
                        <div className="h-5 w-5 bg-primary/10 text-primary flex items-center justify-center rounded text-xs font-bold shrink-0">
                            {idx + 1}
                        </div>
                        <span className="truncate flex-1">{scene.title || `Untitled Scene`}</span>
                    </div>
                ))}
                {scenes.length === 0 && (
                    <div className="text-center p-4 text-xs text-muted-foreground border border-dashed rounded-md m-2">
                        No scenes. Click + to add.
                    </div>
                )}
            </div>
        </div>
    );
}
