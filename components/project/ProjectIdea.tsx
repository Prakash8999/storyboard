"use client";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function ProjectIdea({ project }: { project: any }) {
    const [title, setTitle] = useState(project.title || "");
    const [logline, setLogline] = useState(project.logline || "");
    const [status, setStatus] = useState(project.status || "idea");
    const [saving, setSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleUpdate = async (field: string, value: string) => {
        if (field === 'title') setTitle(value);
        if (field === 'logline') setLogline(value);
        if (field === 'status') setStatus(value);

        setSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                await updateDoc(doc(db, "projects", project.id), { [field]: value });
            } catch (e) { console.error(e) }
            setSaving(false);
        }, 1000);
    };

    return (
        <div className="h-full flex flex-col p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Project Idea</h3>
                {saving ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : <span className="text-xs text-muted-foreground">Saved</span>}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                        value={title}
                        onChange={(e) => handleUpdate('title', e.target.value)}
                        className="font-bold text-lg"
                        placeholder="Project Name"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(val) => handleUpdate('status', val)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="idea">Idea</SelectItem>
                            <SelectItem value="writing">Writing</SelectItem>
                            <SelectItem value="storyboard">Storyboard</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Logline</Label>
                    <Textarea
                        value={logline}
                        onChange={(e) => handleUpdate('logline', e.target.value)}
                        placeholder="A quick summary of your video..."
                        className="min-h-[300px] resize-none text-base leading-relaxed"
                    />
                </div>

                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        Define the core concept of your video here. Keep the logline punchy.
                    </p>
                </div>
            </div>
        </div>
    );
}
