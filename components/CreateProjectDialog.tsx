"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function CreateProjectDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [logline, setLogline] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "projects"), {
                title,
                logline,
                userId: auth.currentUser.uid,
                status: "idea",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setIsOpen(false);
            setTitle("");
            setLogline("");
            router.push(`/project/${docRef.id}`);
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Project">
                <form onSubmit={handleCreate} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. How I Edit Video"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="logline">Logline</Label>
                        <Input
                            id="logline"
                            value={logline}
                            onChange={(e) => setLogline(e.target.value)}
                            placeholder="Short summary..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Project"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
