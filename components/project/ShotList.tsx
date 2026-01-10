"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Image as ImageIcon, Trash2, GripVertical, Loader2, Eye, EyeOff, Maximize2, PenLine, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { uploadImage } from "@/app/actions";

export function ShotList({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    const [sceneData, setSceneData] = useState<any>(null);
    const [shots, setShots] = useState<any[]>([]);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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

    // State for the new Shot Detail Modal
    const [activeShotId, setActiveShotId] = useState<string | null>(null);

    const activeShot = shots.find(s => s.id === activeShotId);

    const addShot = async () => {
        await addDoc(collection(db, "projects", projectId, "scenes", sceneId, "shots"), {
            visual: "",
            audio: "",
            type: "Medium",
            status: "planned",
            order: shots.length + 1,
            createdAt: serverTimestamp()
        });
    };

    const deleteShot = async (shotId: string) => {
        if (confirm("Delete this shot?")) {
            if (activeShotId === shotId) setActiveShotId(null);
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

    const ShotTypes = ["Wide", "Medium", "Close-up", "Extreme Close-up", "POV", "Tracking"];
    const ShotStatuses = ["planned", "in-progress", "completed"];

    if (!sceneData) return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Loading scene...</div>;

    return (
        <div className="h-full flex flex-col w-full bg-background/50">

            {/* Shot Detail Modal - Expanded Edit View */}
            <Modal
                isOpen={!!activeShotId}
                onClose={() => setActiveShotId(null)}
                title={activeShot ? `Editing Shot ${shots.findIndex(s => s.id === activeShot.id) + 1}` : "Shot Details"}
                maxWidth="max-w-[95vw] md:max-w-[1200px]"
            >
                {activeShot && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[80vh] md:h-[70vh]">
                        {/* Left Column: Image (Editable) */}
                        <div className="relative group/edit-img w-full h-full bg-muted rounded-xl overflow-hidden border flex items-center justify-center bg-black/5">
                            {activeShot.visualImage ? (
                                <img src={activeShot.visualImage} alt="ref" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground/30 p-8 space-y-4">
                                    <ImageIcon className="h-20 w-20 mx-auto opacity-50" />
                                    <p className="text-lg font-medium">No reference image attached</p>
                                </div>
                            )}

                            {/* Overlay Button */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/edit-img:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => openImageDialog(activeShot.id)}>
                                <Button variant="secondary" className="gap-2 font-semibold">
                                    <Upload className="h-4 w-4" /> Change Image
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Editable Details */}
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Header Metadata Editors */}
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b shrink-0">
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block">Shot Type</Label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={activeShot.type || "Medium"}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", activeShot.id), { type: e.target.value })}
                                    >
                                        {ShotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block">Status</Label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                                        value={activeShot.status || "planned"}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", activeShot.id), { status: e.target.value })}
                                    >
                                        {ShotStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Scrollable Editor Content */}
                            <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-2">
                                <div className="space-y-2 h-[45%] flex flex-col">
                                    <Label className="text-xs uppercase text-primary/80 font-bold tracking-widest flex items-center gap-2">Visual Description</Label>
                                    <Textarea
                                        value={activeShot.visual || ""}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", activeShot.id), { visual: e.target.value })}
                                        placeholder="Describe the visual action, camera movement, and blocking here..."
                                        className="flex-1 resize-none bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors text-base leading-relaxed p-4 border-muted-foreground/20"
                                    />
                                </div>

                                <div className="space-y-2 h-[45%] flex flex-col">
                                    <Label className="text-xs uppercase text-primary/80 font-bold tracking-widest flex items-center gap-2">Audio Script</Label>
                                    <Textarea
                                        value={activeShot.audio || ""}
                                        onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", activeShot.id), { audio: e.target.value })}
                                        placeholder="Dialogue, sound effects, or music cues..."
                                        className="flex-1 resize-none bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors text-base leading-relaxed italic p-4 border-muted-foreground/20"
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 border-t mt-auto flex justify-end gap-2 shrink-0">
                                <Button size="lg" onClick={() => setActiveShotId(null)}>Done</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Image Upload Modal (Stacked on top if needed) */}
            <Modal isOpen={imageDialogOpen} onClose={() => setImageDialogOpen(false)} title="Attach Reference Image">
                <ShotImageDialogContent
                    initialUrl={shots.find(s => s.id === editingImageShotId)?.visualImage || ""}
                    onSave={saveImage}
                    onClose={() => setImageDialogOpen(false)}
                />
            </Modal>

            {/* Collapsible Scene Header */}
            <div className="flex-none border-b bg-background/50 backdrop-blur-sm transition-all duration-300">
                <div
                    className="flex justify-between items-center p-2 px-4 cursor-pointer hover:bg-muted/50 select-none border-b border-transparent hover:border-border/50"
                    onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{sceneData.title || "Untitled Scene"}</h3>
                        {!isHeaderVisible && (
                            <span className="text-xs text-muted-foreground truncate hidden md:block">
                                {sceneData.location} {sceneData.time && `• ${sceneData.time}`}
                            </span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        {isHeaderVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>

                {isHeaderVisible && (
                    <div className="p-4 md:p-6 pt-2 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-6">
                                <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Scene Heading</Label>
                                <Input
                                    value={sceneData.title || ""}
                                    onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { title: e.target.value })}
                                    placeholder="INT. LOCATION - DAY"
                                    className="font-bold text-lg h-10 border-transparent hover:border-input focus:border-primary transition-all px-0 rounded-none border-b-2 bg-transparent focus:ring-0"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Location</Label>
                                <Input
                                    value={sceneData.location || ""}
                                    onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { location: e.target.value })}
                                    placeholder="Add Location"
                                    className="h-9 bg-transparent border-transparent hover:border-border border-b px-0 rounded-none focus:ring-0"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Time</Label>
                                <Input
                                    value={sceneData.time || ""}
                                    onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { time: e.target.value })}
                                    placeholder="Time"
                                    className="h-9 bg-transparent border-transparent hover:border-border border-b px-0 rounded-none focus:ring-0"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Notes</Label>
                            <Input
                                value={sceneData.notes || ""}
                                onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId), { notes: e.target.value })}
                                placeholder="Atmosphere, Props, specialized equipment needed..."
                                className="h-auto py-1 text-sm text-muted-foreground bg-transparent border-transparent hover:border-border border-b px-0 rounded-none focus:ring-0"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Shots List - Horizontal Table Layout */}
            <div className="flex-1 overflow-y-auto bg-muted/5">
                <div className="p-4 md:p-6 space-y-2 max-w-[1600px] mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Shot List <Badge variant="secondary" className="rounded-full px-2 py-0.5">{shots.length}</Badge>
                        </h3>
                        <Button size="sm" onClick={addShot} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Add Shot</Button>
                    </div>

                    {/* Table Header (Hidden on mobile) */}
                    <div className="hidden md:grid grid-cols-[3rem_5rem_1.5fr_1fr_8rem_3rem] gap-4 px-4 py-2 text-[10px] items-center font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="text-center">#</div>
                        <div>Image</div>
                        <div>Visual</div>
                        <div>Audio</div>
                        <div>Type</div>
                        <div></div>
                    </div>

                    {/* Table Body */}
                    <div className="space-y-3 md:space-y-1">
                        {shots.map((shot, idx) => (
                            <div
                                key={shot.id}
                                className="group relative bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-[3rem_5rem_1.5fr_1fr_8rem_3rem] gap-4 p-4 md:p-2 items-start md:items-center">

                                    {/* Mobile Index */}
                                    <div className="flex md:hidden items-center justify-between mb-2">
                                        <Badge variant="outline">Shot {idx + 1}</Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteShot(shot.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>

                                    {/* Desktop Index */}
                                    <div className="hidden md:flex justify-center text-muted-foreground font-mono text-sm">
                                        {idx + 1}
                                    </div>

                                    {/* Image */}
                                    <div className="relative aspect-video w-20 md:w-full bg-muted rounded-md overflow-hidden border cursor-pointer group/img" onClick={() => openImageDialog(shot.id)}>
                                        {shot.visualImage ? (
                                            <img src={shot.visualImage} alt="ref" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 hover:bg-muted-foreground/5 transition-colors">
                                                <ImageIcon className="h-4 w-4" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                            <ImageIcon className="h-3 w-3 text-white" />
                                        </div>
                                    </div>

                                    {/* Visual Input */}
                                    <div className="min-w-0">
                                        <Textarea
                                            value={shot.visual || ""}
                                            onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shot.id), { visual: e.target.value })}
                                            placeholder="What do we see?"
                                            className="min-h-[80px] md:min-h-[5rem] text-sm resize-none bg-transparent border-transparent hover:border-input focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all p-2"
                                        />
                                    </div>

                                    {/* Audio Input */}
                                    <div className="min-w-0">
                                        <Textarea
                                            value={shot.audio || ""}
                                            onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shot.id), { audio: e.target.value })}
                                            placeholder="What do we hear?"
                                            className="min-h-[60px] md:min-h-[5rem] text-sm resize-none bg-transparent border-transparent hover:border-input focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all p-2 italic text-muted-foreground focus:text-foreground"
                                        />
                                    </div>

                                    {/* Shot Type */}
                                    <div>
                                        <select
                                            className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={shot.type || "Medium"}
                                            onChange={(e) => updateDoc(doc(db, "projects", projectId, "scenes", sceneId, "shots", shot.id), { type: e.target.value })}
                                        >
                                            {ShotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="hidden md:flex justify-end pr-2 gap-1 items-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setActiveShotId(shot.id)} title="Expand Details">
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteShot(shot.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {shots.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground/50 border-2 border-dashed rounded-xl">
                            <p>No shots planned used.</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button variant="outline" className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50" onClick={addShot}>
                            <Plus className="mr-2 h-4 w-4" /> Add Shot
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
                if (initialUrl) onSave(initialUrl);
                else setError("Please select a file");
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
                <div className="space-y-2" key="url-mode">
                    <Label>Image URL</Label>
                    <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                </div>
            ) : (
                <div className="space-y-2" key="upload-mode">
                    <Label>Select Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}

            {(url || (mode === 'upload' && file)) && (
                <div className="relative">
                    {mode === 'url' && url && <img src={url} alt="Preview" className="w-full h-40 object-cover rounded-md border bg-muted" onError={(e) => (e.target as any).src = "https://placehold.co/600x400?text=Invalid+Image"} />}
                    {mode === 'upload' && file && <p className="text-xs text-muted-foreground italic">File selected: {file.name}</p>}
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
                <Button onClick={handleSave} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Image"}
                </Button>
            </div>
        </div>
    )
}
