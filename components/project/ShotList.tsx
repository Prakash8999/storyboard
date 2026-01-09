"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export function ShotList({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    const [sceneData, setSceneData] = useState<any>(null);
    const [shots, setShots] = useState<any[]>([]);

    // Fetch Scene Data
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "projects", projectId, "scenes", sceneId), (doc) => {
            setSceneData({ id: doc.id, ...doc.data() });
        });
        return () => unsub();
    }, [projectId, sceneId]);

    // Fetch Shots
    useEffect(() => {
        const q = query(collection(db, "projects", projectId, "scenes", sceneId, "shots"), orderBy("order", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setShots(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [projectId, sceneId]);

    const [editingImageShotId, setEditingImageShotId] = useState<string | null>(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);

    const addShot = async () => {
        await addDoc(collection(db, "projects", projectId, "scenes", sceneId, "shots"), {
            visual: "",
            audio: "",
            type: "medium",
            status: "planned",
            order: shots.length + 1,
            createdAt: serverTimestamp()
        });
    };

    const deleteShot = async (shotId: string) => {
        if (confirm("Delete this shot?")) {
            await deleteDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shotId));
        }
    }

    const openImageDialog = (shotId: string) => {
        setEditingImageShotId(shotId);
        setImageDialogOpen(true);
    };

    const saveImage = async (url: string) => {
        if (editingImageShotId) {
            await updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", editingImageShotId), { visualImage: url });
            setImageDialogOpen(false);
            setEditingImageShotId(null);
        }
    };

    if (!sceneData) return <div className="p-4">Loading scene...</div>;

    return (
        <div className="h-full flex flex-col space-y-6 p-1">
            <Modal isOpen={imageDialogOpen} onClose={() => setImageDialogOpen(false)} title="Attach Reference Image">
                <ShotImageDialogContent
                    initialUrl={shots.find(s => s.id === editingImageShotId)?.visualImage || ""}
                    onSave={saveImage}
                    onClose={() => setImageDialogOpen(false)}
                />
            </Modal>

            {/* Scene Details */}
            <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold text-sm">Scene Details</h3>
                <div className="grid gap-4">
                    <div>
                        <Label className="text-xs">Scene Heading</Label>
                        <Input
                            value={sceneData.title || ""}
                            onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { title: e.target.value })}
                            placeholder="e.g. INT. COFFEE SHOP - DAY"
                            className="font-bold"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">Location</Label>
                            <Input
                                value={sceneData.location || ""}
                                onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { location: e.target.value })}
                                placeholder="Location"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Time</Label>
                            <Input
                                value={sceneData.time || ""}
                                onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { time: e.target.value })}
                                placeholder="Day/Night"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <Textarea
                            value={sceneData.notes || ""}
                            onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { notes: e.target.value })}
                            placeholder="Props, lighting, mood..."
                            className="min-h-[60px]"
                        />
                    </div>
                </div>
            </div>

            {/* Shots */}
            <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center sticky top-0 bg-background py-2">
                    <h3 className="font-semibold text-sm">Shots ({shots.length})</h3>
                    <Button size="sm" onClick={addShot}><Plus className="mr-2 h-4 w-4" /> Add Shot</Button>
                </div>

                <div className="grid gap-3">
                    {shots.map((shot, idx) => (
                        <div key={shot.id} className="border rounded-lg p-3 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold">{idx + 1}</span>
                                    <Badge variant="outline" className="text-[10px] h-5 cursor-pointer uppercase">{shot.type || 'Shot'}</Badge>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                {shot.visualImage && (
                                    <div className="relative group/image">
                                        <img src={shot.visualImage} alt="Reference" className="w-full h-32 object-cover rounded-md border" />
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                            onClick={() => openImageDialog(shot.id)}
                                        >
                                            <ImageIcon className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-[10px] text-muted-foreground uppercase">Visual</Label>
                                    <Textarea
                                        value={shot.visual || ""}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shot.id), { visual: e.target.value })}
                                        placeholder="Describe the shot..."
                                        className="min-h-[40px] text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] text-muted-foreground uppercase">Audio</Label>
                                    <Input
                                        value={shot.audio || ""}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shot.id), { audio: e.target.value })}
                                        placeholder="Dialogue or sound..."
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                <Button variant="ghost" size="sm" className={cn("h-6 w-6 p-0", shot.visualImage && "text-primary")} title="Attach Image" onClick={() => openImageDialog(shot.id)}><ImageIcon className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteShot(shot.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    ))}
                    {shots.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                            No shots in this scene yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { uploadImage } from "@/app/actions";
import { Loader2 } from "lucide-react";

function ShotImageDialogContent({ isOpen, onClose, onSave, initialUrl }: any) {
    const [mode, setMode] = useState<'url' | 'upload'>('upload');
    const [url, setUrl] = useState(initialUrl || "");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setError("");
        if (mode === 'url') {
            onSave(url);
        } else {
            if (!file) {
                if (url) {
                    // if they switched to upload but have an existing url and didn't pick a new file, maybe they meant to keep it?
                    // But generally 'upload' implies new file. If they have a URL they should use URL mode or we assume they want to keep it if no file selected?
                    // Let's just assume if no file selected, we do nothing or save empty if they really want to clear it?
                    // If visualImage is already set, and they didn't pick a file, we probably shouldn't clear it unless they explicitly want to.
                    // For now, require file if in upload mode, unless we fallback to existing URL.
                    if (initialUrl) onSave(initialUrl);
                    else setError("Please select a file");
                    return;
                }
                setError("Please select a file");
                return;
            }

            setUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await uploadImage(formData);
                onSave(res.secure_url);
            } catch (e: any) {
                console.error(e);
                setError("Upload failed. Check API config.");
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="flex bg-muted rounded-lg p-1">
                <button onClick={() => setMode('upload')} className={cn("flex-1 text-sm py-1.5 rounded-md transition-all", mode === 'upload' ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>Upload</button>
                <button onClick={() => setMode('url')} className={cn("flex-1 text-sm py-1.5 rounded-md transition-all", mode === 'url' ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>Image URL</button>
            </div>

            {mode === 'url' ? (
                <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                    <p className="text-[10px] text-muted-foreground">Paste a direct link to an image.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label>Select Image</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-[10px] text-muted-foreground">Uploads to Cloudinary.</p>
                </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            {(url || (mode === 'upload' && file)) && (
                <div className="relative">
                    {mode === 'url' && url && <img src={url} alt="Preview" className="w-full h-40 object-cover rounded-md border bg-muted" onError={(e) => (e.target as any).src = "https://placehold.co/600x400?text=Invalid+Image"} />}
                    {mode === 'upload' && file && <p className="text-xs text-muted-foreground italic">File selected: {file.name}</p>}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
                <Button onClick={handleSave} disabled={uploading}>
                    {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Save Image"}
                </Button>
            </div>
        </div>
    )
}
