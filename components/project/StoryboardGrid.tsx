import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

function SceneShots({ projectId, scene }: { projectId: string; scene: any }) {
    const [shots, setShots] = useState<any[]>([]);
    const [selectedShot, setSelectedShot] = useState<any>(null);

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
                    <Card key={shot.id} className="overflow-hidden bg-card hover:ring-2 ring-primary/50 transition-all flex flex-col h-full">
                        <div
                            className="aspect-video bg-muted flex items-center justify-center relative group cursor-pointer"
                            onClick={() => setSelectedShot(shot)}
                        >
                            {shot.visualImage ? (
                                <img src={shot.visualImage} alt="Shot visual" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-muted-foreground/20">{idx + 1}</span>
                            )}
                            <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur">{shot.type || 'Shot'}</Badge>
                            </div>
                        </div>
                        <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                            <div className="flex-1">
                                <p className="text-xs font-medium line-clamp-2" title={shot.visual}>{shot.visual || "No visual description"}</p>
                                <p className="text-[10px] text-muted-foreground italic line-clamp-2 mt-1">{shot.audio || "No audio"}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-[10px] text-primary self-start mt-2 hover:bg-transparent hover:underline"
                                onClick={() => setSelectedShot(shot)}
                            >
                                See Full Text
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={!!selectedShot}
                onClose={() => setSelectedShot(null)}
                title={selectedShot ? `Shot ${shots.findIndex(s => s.id === selectedShot.id) + 1} Details` : "Shot Details"}
                maxWidth="max-w-6xl"
            >
                {selectedShot && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                            {selectedShot.visualImage ? (
                                <img src={selectedShot.visualImage} alt="Visual Ref" className="w-full h-full object-contain bg-black/5" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <span className="text-6xl font-bold opacity-20">{shots.findIndex(s => s.id === selectedShot.id) + 1}</span>
                                    <p className="text-sm mt-2">No image attached</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
                            <div className="flex gap-2">
                                <Badge>{selectedShot.type || "Medium"}</Badge>
                                <Badge variant="outline" className="capitalize">{selectedShot.status || "Planned"}</Badge>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visual Description</h4>
                                <p className="text-base whitespace-pre-wrap leading-relaxed">
                                    {selectedShot.visual || <span className="text-muted-foreground italic">No description provided.</span>}
                                </p>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-lg space-y-1 border">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/80">Audio / Dialogue</h4>
                                <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
                                    {selectedShot.audio || "No audio specified."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
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
