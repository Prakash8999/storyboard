"use client";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export function ScriptEditor({ projectId }: { projectId: string }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const d = await getDoc(doc(db, "projects", projectId));
                if (d.exists()) {
                    setContent(d.data().script || "");
                }
            } catch (e) { console.error(e) }
            setLoading(false);
        }
        load();
    }, [projectId]);

    const handleChange = (val: string) => {
        setContent(val);
        if (!loading) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setSaving(true);
            timeoutRef.current = setTimeout(async () => {
                try {
                    await updateDoc(doc(db, "projects", projectId), { script: val });
                } catch (e) { console.error(e) }
                setSaving(false);
            }, 2000);
        }
    };

    if (loading) return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading script...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="font-semibold text-sm">Script Document</h3>
                {saving ? <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span> : <span className="text-xs text-muted-foreground">Autosaved</span>}
            </div>
            <textarea
                className="flex-1 w-full bg-background/50 border rounded-lg p-6 resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono text-sm leading-relaxed"
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Start writing your script here... Use clear scene headers like 'INTRO - STUDIO'"
            />
        </div>
    );
}
