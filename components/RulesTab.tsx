"use client";

import { useState, useEffect } from "react";
import { Plus, Save, History, Edit2, ChevronLeft, List, Copy, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

interface RuleVersion {
    id: string;
    versionNumber: number;
    title: string;
    description: string;
    createdAt: any; // Firestore Timestamp
}

interface Rule {
    id: string;
    userId: string;
    versions: RuleVersion[];
    updatedAt: any;
}

export function RulesTab() {
    const { user } = useAuth();
    const [rules, setRules] = useState<Rule[]>([]);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Edit form state
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // View state for specific version
    const [viewVersionId, setViewVersionId] = useState<string | null>(null);

    // Fetch rules from Firestore
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "rules"),
            where("userId", "==", user.uid)
            // orderBy("updatedAt", "desc") // Sort client-side for now to avoid index issues
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rulesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Rule[];

            // Client-side sort by updatedAt desc
            rulesData.sort((a, b) => {
                const dateA = a.updatedAt?.seconds || 0;
                const dateB = b.updatedAt?.seconds || 0;
                return dateB - dateA;
            });

            setRules(rulesData);
        });

        return () => unsubscribe();
    }, [user]);

    const selectedRule = rules.find(r => r.id === selectedRuleId);

    // Logic to determine what to display
    const currentDisplayVersion = selectedRule
        ? (viewVersionId
            ? selectedRule.versions.find(v => v.id === viewVersionId)
            : selectedRule.versions[selectedRule.versions.length - 1])
        : null;

    const isLatestVersion = selectedRule && currentDisplayVersion?.id === selectedRule.versions[selectedRule.versions.length - 1].id;

    const handleCreateRule = () => {
        setIsCreating(true);
        setSelectedRuleId(null);
        setEditTitle("");
        setEditDescription("");
        setIsEditing(true);
        setViewVersionId(null);
    };

    const handleEditStart = () => {
        if (!currentDisplayVersion) return;
        setEditTitle(currentDisplayVersion.title);
        setEditDescription(currentDisplayVersion.description);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!user) return;

        if (isCreating) {
            // Create new rule
            const newVersion: RuleVersion = {
                id: `v1-${Date.now()}`,
                versionNumber: 1,
                title: editTitle,
                description: editDescription,
                createdAt: Timestamp.now()
            };

            const newRuleData = {
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                versions: [newVersion]
            };

            try {
                const docRef = await addDoc(collection(db, "rules"), newRuleData);
                setIsCreating(false);
                setIsEditing(false);
                setSelectedRuleId(docRef.id); // Select the newly created rule
            } catch (error) {
                console.error("Error creating rule:", error);
            }

        } else if (selectedRule) {
            // Update existing rule
            const latestVersionNumber = selectedRule.versions[selectedRule.versions.length - 1].versionNumber;
            const newVersion: RuleVersion = {
                id: `v${latestVersionNumber + 1}-${Date.now()}`,
                versionNumber: latestVersionNumber + 1,
                title: editTitle,
                description: editDescription,
                createdAt: Timestamp.now()
            };

            const updatedVersions = [...selectedRule.versions, newVersion];

            try {
                await updateDoc(doc(db, "rules", selectedRule.id), {
                    versions: updatedVersions,
                    updatedAt: serverTimestamp()
                });
                setIsEditing(false);
                setViewVersionId(null); // Reset to view latest
            } catch (error) {
                console.error("Error updating rule:", error);
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (isCreating) {
            setIsCreating(false);
            setSelectedRuleId(null);
        }
    };

    // Helper to format date
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";
        // Handle both Firestore Timestamp and JS Date (just in case)
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleCopy = () => {
        if (!currentDisplayVersion) return;
        const textToCopy = `${currentDisplayVersion.title}\n\n${currentDisplayVersion.description}`;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in-50">
            {/* Left Sidebar: Rule List */}
            <div className={`w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 ${selectedRuleId || isCreating ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Rules Library</h2>
                    <Button onClick={handleCreateRule} size="sm" className="bg-primary/90 hover:bg-primary shadow-glow transition-all">
                        <Plus className="w-4 h-4 mr-1" /> New
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-secondary/20">
                    {rules.length === 0 && !isCreating && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            No rules found. Create one to get started.
                        </div>
                    )}
                    {rules.map(rule => {
                        const latest = rule.versions[rule.versions.length - 1];
                        const isSelected = selectedRuleId === rule.id;
                        if (!latest) return null; // Should not happen
                        return (
                            <Card
                                key={rule.id}
                                onClick={() => {
                                    setSelectedRuleId(rule.id);
                                    setIsEditing(false);
                                    setIsCreating(false);
                                    setViewVersionId(null);
                                }}
                                className={cn(
                                    "cursor-pointer transition-all duration-200 border-l-4 hover:shadow-md",
                                    isSelected
                                        ? "border-l-primary bg-secondary/5 border-t-border/50 border-r-border/50 border-b-border/50 shadow-sm"
                                        : "border-l-transparent hover:border-l-primary/30"
                                )}
                            >
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base line-clamp-1">{latest.title}</CardTitle>
                                        <Badge variant="outline" className="text-[10px] h-5">v{latest.versionNumber}</Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 text-xs mt-1">
                                        {latest.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel: Detail/Edit View */}
            <div className={`flex-1 flex flex-col ${(!selectedRuleId && !isCreating) ? 'hidden md:flex' : 'flex'}`}>
                {selectedRule || isCreating ? (
                    <Card className="h-full flex flex-col border-border/60 shadow-lg bg-gradient-to-b from-card to-secondary/5 overflow-hidden">

                        {/* Header Area */}
                        <div className="p-6 border-b flex flex-col gap-4 bg-card/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden -ml-2 text-muted-foreground"
                                    onClick={() => {
                                        setSelectedRuleId(null);
                                        setIsCreating(false);
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                </Button>

                                {!isEditing && !isCreating && selectedRule && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <div className="flex items-center gap-2 mr-4">
                                            <History className="w-4 h-4 text-muted-foreground" />
                                            <select
                                                className="bg-transparent text-sm border-none focus:ring-0 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                                value={currentDisplayVersion?.id || ""}
                                                onChange={(e) => setViewVersionId(e.target.value === selectedRule.versions[selectedRule.versions.length - 1].id ? null : e.target.value)}
                                            >
                                                {selectedRule.versions.slice().reverse().map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        v{v.versionNumber} - {formatDate(v.createdAt)}
                                                        {v.id === selectedRule.versions[selectedRule.versions.length - 1].id ? " (Latest)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <Button
                                            onClick={handleCopy}
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                            {isCopied ? "Copied" : "Copy"}
                                        </Button>

                                        {isLatestVersion && (
                                            <Button onClick={handleEditStart} variant="secondary" size="sm" className="shadow-sm">
                                                <Edit2 className="w-4 h-4 mr-2" /> Edit Rule
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Rule Title"
                                        className="text-2xl font-bold h-auto py-2 px-3 border-transparent bg-secondary/20 hover:bg-secondary/30 focus-visible:bg-secondary/30 focus-visible:border-primary/20 transition-all rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{currentDisplayVersion?.title}</h1>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary" className="font-normal bg-secondary/50">Version {currentDisplayVersion?.versionNumber}</Badge>
                                        <span>Created {formatDate(currentDisplayVersion?.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            {isEditing ? (
                                <Textarea
                                    className="min-h-[300px] text-base leading-relaxed p-4 bg-secondary/10 border-dashed border-2 resize-none focus-visible:ring-0 focus-visible:border-primary/50"
                                    placeholder="Describe the rule in detail..."
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground/90">
                                        {currentDisplayVersion?.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions (Only when editing) */}
                        {isEditing && (
                            <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-3 animate-in slide-in-from-bottom-2">
                                <span className="text-xs text-muted-foreground mr-auto pl-2">
                                    {isCreating
                                        ? "Creating initial version v1"
                                        : `Saving will create version ${selectedRule ? selectedRule.versions[selectedRule.versions.length - 1].versionNumber + 1 : ''}`
                                    }
                                </span>
                                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave} className="bg-primary text-primary-foreground shadow-glow">
                                    <Save className="w-4 h-4 mr-2" /> {isCreating ? "Create Rule" : "Save Version"}
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-card/30 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                            <List className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Rule Selected</h3>
                        <p className="max-w-sm text-sm">Select a rule from the library on the left to view its details and version history, or create a new one.</p>
                        <Button onClick={handleCreateRule} variant="outline" className="mt-6">
                            Create New Rule
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
