"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Trash2, Mic, Film, AlignLeft, User, MessageSquare, ArrowRight, Eye, Layout, MonitorPlay, Maximize2, Minimize2, Copy, FileText, AlertTriangle } from "lucide-react";
import { SceneList } from "@/components/project/SceneList";

interface ScreenplayBlock {
    id: string;
    type: 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
    text: string;
}

interface SceneData {
    id: string;
    title: string;
    order: number;
    intExt?: 'INT.' | 'EXT.' | 'INT./EXT.';
    location?: string;
    time?: 'DAY' | 'NIGHT' | 'CONTINUOUS' | 'MOMENTS LATER';
    status?: 'draft' | 'locked' | 'shot-ready';
    screenplay?: ScreenplayBlock[];
    goal?: string;
    tone?: string;
}

export function ScreenplayEditor({ projectId, activeSceneId, onSelectScene }: { projectId: string; activeSceneId: string | null; onSelectScene: (id: string | null) => void }) {
    const [activeScene, setActiveScene] = useState<SceneData | null>(null);
    const [shotCount, setShotCount] = useState(0);
    const [focusMode, setFocusMode] = useState(false);
    const [readMode, setReadMode] = useState(false);

    // Subscribe to the active scene
    useEffect(() => {
        if (!activeSceneId) {
            setActiveScene(null);
            setShotCount(0);
            return;
        }

        const sceneUnsub = onSnapshot(doc(db, "projects", projectId, "scenes", activeSceneId), (d) => {
            if (d.exists()) {
                setActiveScene({ id: d.id, ...d.data() } as SceneData);
            }
        });

        // Shot awareness
        const shotsUnsub = onSnapshot(collection(db, "projects", projectId, "scenes", activeSceneId, "shots"), (snap) => {
            setShotCount(snap.size);
        });

        return () => {
            sceneUnsub();
            shotsUnsub();
        };
    }, [projectId, activeSceneId]);

    const updateScene = async (data: Partial<SceneData>) => {
        if (!activeSceneId) return;
        try {
            await updateDoc(doc(db, "projects", projectId, "scenes", activeSceneId), data);
        } catch (e) {
            console.error("Failed to update scene", e);
        }
    };

    const handleHeaderChange = (field: keyof SceneData, value: string) => {
        updateScene({ [field]: value });
    };

    const addBlock = (type: ScreenplayBlock['type']) => {
        if (!activeScene) return;
        const newBlock: ScreenplayBlock = {
            id: crypto.randomUUID(),
            type,
            text: ''
        };
        const currentBlocks = activeScene.screenplay || [];
        updateScene({ screenplay: [...currentBlocks, newBlock] });
    };

    const updateBlock = (blockId: string, text: string, type: ScreenplayBlock['type']) => {
        if (!activeScene) return;

        let processedText = text;
        if (type === 'character' || type === 'transition') { // intExt handled separately
            processedText = text.toUpperCase();
        }

        const currentBlocks = activeScene.screenplay || [];
        const newBlocks = currentBlocks.map(b => b.id === blockId ? { ...b, text: processedText } : b);
        updateScene({ screenplay: newBlocks });
    };

    const deleteBlock = (blockId: string) => {
        if (!activeScene) return;
        const currentBlocks = activeScene.screenplay || [];
        updateScene({ screenplay: currentBlocks.filter(b => b.id !== blockId) });
    };

    const renderSceneHeading = () => {
        if (!activeScene) return "SELECT A SCENE";
        const ie = activeScene.intExt || "INT/EXT";
        const loc = (activeScene.location || "LOCATION").toUpperCase();
        const time = (activeScene.time || "TIME").toUpperCase();
        return `${ie} ${loc} - ${time}`;
    };

    const copyToClipboard = () => {
        if (!activeScene) return;
        let text = renderSceneHeading() + '\n\n';
        (activeScene.screenplay || []).forEach(b => {
            if (b.type === 'character') text += '\n\t\t\t\t' + b.text + '\n';
            else if (b.type === 'dialogue') text += '\t\t' + b.text + '\n';
            else if (b.type === 'parenthetical') text += '\t\t\t' + b.text + '\n';
            else if (b.type === 'transition') text += '\n\t\t\t\t\t\t\t' + b.text + '\n';
            else text += b.text + '\n\n';
        });
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    // Derived Stats
    const charStats = (activeScene?.screenplay || []).reduce((acc, block) => {
        if (block.type === 'character') {
            const name = block.text.trim();
            if (name) acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // Warnings
    const warnings = [];
    if (activeScene) {
        if (!activeScene.intExt) warnings.push("Missing INT./EXT.");
        if ((activeScene.screenplay || []).length > 60) warnings.push("Scene pot. too long");
        const dialogueDensity = (activeScene.screenplay || []).filter(b => b.type === 'dialogue').length;
        if (dialogueDensity > 20) warnings.push("Dialogue dense");
        if ((activeScene.screenplay || []).length > 0 && !(activeScene.screenplay || []).some(b => b.type === 'action')) warnings.push("Missing Action");
    }

    return (
        <div className="flex h-full bg-background relative overflow-hidden group/main">
            {/* Scene Navigator */}
            <div className={cn(
                "border-r bg-muted/10 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
                focusMode ? "w-0 min-w-0 opacity-0" : "w-1/4 min-w-[250px] max-w-[300px] opacity-100"
            )}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold flex items-center gap-2 text-sm">
                        <Film className="h-4 w-4" /> Scene Navigator
                    </h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFocusMode(true)} title="Focus Mode">
                        <Maximize2 className="h-3 w-3" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <SceneList projectId={projectId} activeSceneId={activeSceneId} onSelectScene={onSelectScene} />
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Toolbar / Header */}
                {activeScene ? (
                    <>
                        <div className="p-3 border-b bg-background/95 backdrop-blur flex flex-col gap-3 shrink-0 z-10 shadow-sm">
                            {/* Upper Row: Controls & Stats */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {focusMode && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={() => setFocusMode(false)} title="Exit Focus Mode">
                                            <Minimize2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-[10px] uppercase",
                                        activeScene.status === 'shot-ready' ? "bg-green-100 text-green-700 border-green-200" :
                                            activeScene.status === 'locked' ? "bg-red-100 text-red-700 border-red-200" : "bg-muted text-muted-foreground"
                                    )}>
                                        {activeScene.status || 'Draft'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-muted-foreground/20" title="Go to Scenes tab to edit shots">
                                        <MonitorPlay className="h-3 w-3" /> {shotCount} Shots
                                    </Badge>

                                    {warnings.map((w, i) => (
                                        <Badge key={i} variant="destructive" className="text-[10px] gap-1 opacity-80">
                                            <AlertTriangle className="h-3 w-3" /> {w}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setReadMode(!readMode)} className={cn("h-7 text-xs gap-1", readMode && "bg-accent")}>
                                        <Eye className="h-3 w-3" /> {readMode ? "Edit" : "Read"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 text-xs gap-1">
                                        <Copy className="h-3 w-3" /> Copy
                                    </Button>
                                </div>
                            </div>

                            {/* Lower Row: Scene Header Editor (Only in Edit Mode) */}
                            {!readMode && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                                    <Select value={activeScene.intExt} onValueChange={(v) => handleHeaderChange('intExt', v)}>
                                        <SelectTrigger className="w-[85px] h-8 text-xs font-mono font-bold">
                                            <SelectValue placeholder="I/E" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INT.">INT.</SelectItem>
                                            <SelectItem value="EXT.">EXT.</SelectItem>
                                            <SelectItem value="INT./EXT.">INT./EXT.</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="LOCATION"
                                        className="flex-1 uppercase font-mono h-8 text-xs font-bold tracking-wide"
                                        value={activeScene.location || ''}
                                        onChange={(e) => handleHeaderChange('location', e.target.value.toUpperCase())}
                                    />
                                    <Select value={activeScene.time} onValueChange={(v) => handleHeaderChange('time', v)}>
                                        <SelectTrigger className="w-[100px] h-8 text-xs font-mono font-bold">
                                            <SelectValue placeholder="TIME" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DAY">DAY</SelectItem>
                                            <SelectItem value="NIGHT">NIGHT</SelectItem>
                                            <SelectItem value="CONTINUOUS">CONTINUOUS</SelectItem>
                                            <SelectItem value="MOMENTS LATER">LATER</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={activeScene.status || 'draft'} onValueChange={(v) => handleHeaderChange('status', v)}>
                                        <SelectTrigger className="w-[90px] h-8 text-xs">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="locked">Locked</SelectItem>
                                            <SelectItem value="shot-ready">Ready</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {!readMode && (
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="shrink-0 text-[10px] uppercase font-bold text-muted-foreground">Goal:</span>
                                        <Input
                                            className="h-6 text-xs bg-muted/30 border-transparent hover:border-border focus:border-border transition-all flex-1"
                                            placeholder="One-line goal for this scene..."
                                            value={activeScene.goal || ''}
                                            onChange={(e) => handleHeaderChange('goal', e.target.value)}
                                        />
                                    </div>
                                    {/* Char Stats Inline */}
                                    <div className="flex items-center gap-2 shrink-0 overflow-hidden max-w-[300px]">
                                        {Object.entries(charStats).map(([name, count]) => (
                                            <Badge key={name} variant="outline" className="text-[9px] px-1 py-0 h-5 font-mono text-muted-foreground">
                                                {name}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Writing Area */}
                        <div className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-900/30 p-4 md:p-8 flex justify-center scroll-smooth">
                            <div className={cn(
                                "w-full bg-background shadow-sm min-h-[80vh] p-8 md:p-12 mb-20 transition-all duration-300",
                                readMode ? "max-w-4xl border-x" : "max-w-3xl border rounded-md"
                            )}>
                                {/* Scene Heading Display */}
                                <div className="font-mono font-bold text-lg mb-6 uppercase border-b-2 border-neutral-900 dark:border-neutral-100 pb-2 text-neutral-900 dark:text-neutral-100">
                                    {renderSceneHeading()}
                                </div>

                                {/* Blocks */}
                                <div className="space-y-1">
                                    {(activeScene.screenplay || []).map((block, idx) => (
                                        <div key={block.id} className="group relative pl-8 pr-8 hover:bg-muted/10 rounded">
                                            {!readMode && (
                                                <div className="absolute left-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 -translate-x-full pr-2">
                                                    <button onClick={() => deleteBlock(block.id)} className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded text-muted-foreground transition-colors"><Trash2 className="h-3 w-3" /></button>
                                                </div>
                                            )}
                                            <div className={cn(
                                                "w-full transition-all duration-200",
                                                block.type === 'action' && "text-left text-base font-serif leading-relaxed",
                                                block.type === 'character' && "text-center font-bold mt-6 mb-0 uppercase w-[60%] mx-auto tracking-wider",
                                                block.type === 'dialogue' && "text-center w-[70%] md:w-[50%] mx-auto mb-2 font-serif",
                                                block.type === 'parenthetical' && "text-center text-sm italic w-[40%] mx-auto -mt-1 mb-1 text-muted-foreground",
                                                block.type === 'transition' && "text-right font-bold uppercase mt-6 mb-6 text-sm tracking-widest mr-4"
                                            )}>
                                                {readMode ? (
                                                    <div className="whitespace-pre-wrap">{block.text}</div>
                                                ) : (
                                                    <textarea
                                                        value={block.text}
                                                        onChange={(e) => updateBlock(block.id, e.target.value, block.type)}
                                                        placeholder={block.type.toUpperCase()}
                                                        className="w-full bg-transparent resize-none overflow-hidden focus:outline-none focus:bg-accent/10 rounded px-1 active:ring-0 text-inherit font-inherit py-1"
                                                        rows={1}
                                                        style={{ minHeight: '1.5em', height: 'auto' }}
                                                        onInput={(e) => {
                                                            const target = e.target as HTMLTextAreaElement;
                                                            target.style.height = 'auto';
                                                            target.style.height = target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Block Controls (Bottom) */}
                                {!readMode && (
                                    <div className="mt-12 flex flex-wrap justify-center gap-3 opacity-80 hover:opacity-100 transition-opacity p-6 border-2 border-dashed rounded-xl bg-muted/5">
                                        <div className="w-full text-center text-xs text-muted-foreground mb-2 font-medium uppercase tracking-widest">Append Element</div>
                                        <Button size="sm" variant="outline" onClick={() => addBlock('action')} title="Action" className="hover:border-primary/50 hover:bg-primary/5">
                                            <AlignLeft className="h-3 w-3 mr-1" /> Action
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addBlock('character')} title="Character" className="hover:border-primary/50 hover:bg-primary/5">
                                            <User className="h-3 w-3 mr-1" /> Character
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addBlock('dialogue')} title="Dialogue" className="hover:border-primary/50 hover:bg-primary/5">
                                            <MessageSquare className="h-3 w-3 mr-1" /> Dialogue
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addBlock('parenthetical')} title="Parenthetical" className="hover:border-primary/50 hover:bg-primary/5">
                                            ( )
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addBlock('transition')} title="Transition" className="hover:border-primary/50 hover:bg-primary/5">
                                            <ArrowRight className="h-3 w-3 mr-1" /> Trans
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                        <FileText className="h-16 w-16 opacity-20 mb-4" />
                        <h3 className="text-lg font-medium">Select a Scene to Write</h3>
                        <p className="text-sm max-w-xs text-center mt-2">Choose a scene from the navigator on the left to start writing your screenplay.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
