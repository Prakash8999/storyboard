"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

interface Topic {
    id: string;
    text: string;
    checked: boolean;
    createdAt: any;
}

export function TopicListTab() {
    const { user } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [newTopic, setNewTopic] = useState("");
    const [bulkTopics, setBulkTopics] = useState("");
    const [showBulkInput, setShowBulkInput] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "topics"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const topicsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Topic[];

            // Sort by creation date, newest first
            topicsData.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            setTopics(topicsData);
        });

        return () => unsubscribe();
    }, [user]);

    const addSingleTopic = async () => {
        if (!user || !newTopic.trim()) return;

        try {
            await addDoc(collection(db, "topics"), {
                userId: user.uid,
                text: newTopic.trim(),
                checked: false,
                createdAt: new Date(),
            });
            setNewTopic("");
        } catch (error) {
            console.error("Error adding topic:", error);
        }
    };

    const addBulkTopics = async () => {
        if (!user || !bulkTopics.trim()) return;

        try {
            // Split by newlines and filter out empty lines
            const topicLines = bulkTopics
                .split("\n")
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // Add each topic to Firestore with reverse incremental timestamps
            // Since we sort by newest first, the FIRST topic needs the HIGHEST timestamp
            // So we count down: first topic gets +N ms, last topic gets +0 ms
            const baseTime = new Date();
            const totalTopics = topicLines.length;
            const promises = topicLines.map((text, index) =>
                addDoc(collection(db, "topics"), {
                    userId: user.uid,
                    text,
                    checked: false,
                    createdAt: new Date(baseTime.getTime() + (totalTopics - index)),
                })
            );

            await Promise.all(promises);
            setBulkTopics("");
            setShowBulkInput(false);
        } catch (error) {
            console.error("Error adding bulk topics:", error);
        }
    };

    const toggleTopic = async (topicId: string, currentChecked: boolean) => {
        try {
            await updateDoc(doc(db, "topics", topicId), {
                checked: !currentChecked,
            });
        } catch (error) {
            console.error("Error toggling topic:", error);
        }
    };

    const deleteTopic = async (topicId: string) => {
        try {
            await deleteDoc(doc(db, "topics", topicId));
        } catch (error) {
            console.error("Error deleting topic:", error);
        }
    };

    const copyTopic = async (text: string, topicId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(topicId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Error copying topic:", error);
        }
    };

    const selectAllTopics = () => {
        const allChecked = topics.every(t => t.checked);
        topics.forEach(topic => {
            updateDoc(doc(db, "topics", topic.id), {
                checked: !allChecked,
            });
        });
    };

    const deleteSelectedTopics = async () => {
        const selectedTopics = topics.filter(t => t.checked);
        if (selectedTopics.length === 0) return;

        if (!confirm(`Delete ${selectedTopics.length} selected topic(s)?`)) return;

        try {
            const promises = selectedTopics.map(topic =>
                deleteDoc(doc(db, "topics", topic.id))
            );
            await Promise.all(promises);
        } catch (error) {
            console.error("Error deleting selected topics:", error);
        }
    };

    const selectedCount = topics.filter(t => t.checked).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Topic List Ideas</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your video topic ideas and brainstorming list
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* {selectedCount > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelectedTopics}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedCount})
                        </Button>
                    )} */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkInput(!showBulkInput)}
                    >
                        {showBulkInput ? "Single Topic" : "Bulk Add"}
                    </Button>
                </div>
            </div>

            {/* Add Topic Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {showBulkInput ? "Add Multiple Topics" : "Add New Topic"}
                    </CardTitle>
                    <CardDescription>
                        {showBulkInput
                            ? "Paste multiple topics (one per line) to add them all at once"
                            : "Add a single topic idea to your list"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showBulkInput ? (
                        <>
                            <Textarea
                                placeholder="Paste your topics here, one per line...&#10;Example:&#10;How to start a YouTube channel&#10;Best video editing tips&#10;Camera settings for beginners"
                                value={bulkTopics}
                                onChange={(e) => setBulkTopics(e.target.value)}
                                rows={8}
                                className="resize-none"
                            />
                            <Button
                                onClick={addBulkTopics}
                                disabled={!bulkTopics.trim()}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add All Topics
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter a topic idea..."
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        addSingleTopic();
                                    }
                                }}
                            />
                            <Button
                                onClick={addSingleTopic}
                                disabled={!newTopic.trim()}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Topics List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Your Topics ({topics.length})</CardTitle>
                        {topics.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectAllTopics}
                            >
                                {topics.every(t => t.checked) ? "Deselect All" : "Select All"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {topics.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">No topics yet. Add your first topic idea above!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border transition-all group hover:bg-muted/50",
                                        topic.checked && "bg-muted/30"
                                    )}
                                >
                                    <Checkbox
                                        checked={topic.checked}
                                        onCheckedChange={() => toggleTopic(topic.id, topic.checked)}
                                        className="mt-0.5"
                                    />
                                    <p
                                        className={cn(
                                            "flex-1 text-sm",
                                            topic.checked && "line-through text-muted-foreground"
                                        )}
                                    >
                                        {topic.text}
                                    </p>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => copyTopic(topic.text, topic.id)}
                                        >
                                            {copiedId === topic.id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteTopic(topic.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
