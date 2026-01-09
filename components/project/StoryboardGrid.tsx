"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SceneShots({ projectId, scene }: { projectId: string; scene: any }) {
    const [shots, setShots] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "projects", projectId, "scenes", scene.id, "shots"), orderBy("order", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setShots(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [projectId, scene.id]);

    if (shots.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b">{scene.title || "Untitled Scene"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {shots.map((shot, idx) => (
                    <Card key={shot.id} className="overflow-hidden bg-card hover:ring-2 ring-primary/50 transition-all">
                        <div className="aspect-video bg-muted flex items-center justify-center relative group">
                            {/* Placeholder for image */}
                            <span className="text-4xl font-bold text-muted-foreground/20">{idx + 1}</span>
                            <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur">{shot.type || 'Shot'}</Badge>
                            </div>
                        </div>
                        <CardContent className="p-3 space-y-2">
                            <p className="text-xs font-medium line-clamp-2">{shot.visual || "No visual description"}</p>
                            <p className="text-[10px] text-muted-foreground italic line-clamp-2">{shot.audio || "No audio"}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function StoryboardGrid({ projectId }: { projectId: string }) {
    const [scenes, setScenes] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "projects", projectId, "scenes"), orderBy("order", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setScenes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [projectId]);

    return (
        <div className="p-4 md:p-8">
            {scenes.map(scene => (
                <SceneShots key={scene.id} projectId={projectId} scene={scene} />
            ))}
            {scenes.length === 0 && <div className="text-center text-muted-foreground">No scenes created yet. Switch to Workspace to add scenes.</div>}
        </div>
    );
}
