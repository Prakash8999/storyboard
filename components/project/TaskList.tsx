"use client";

import { useState, useRef, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

interface Task {
    id: string;
    text: string;
    completed: boolean;
    subtasks: Subtask[];
    createdAt?: number;
    updatedAt?: number;
    sort_priority?: number;
}

// Sortable Task Item Component
function SortableTaskItem({
    task,
    toggleTask,
    deleteTask,
    updateTaskText,
    addSubtask,
    updateSubtaskText,
    toggleSubtask,
    deleteSubtask
}: {
    task: Task;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    updateTaskText: (id: string, text: string) => void;
    addSubtask: (taskId: string, text: string) => void;
    updateSubtaskText: (taskId: string, subtaskId: string, text: string) => void;
    toggleSubtask: (taskId: string, subtaskId: string) => void;
    deleteSubtask: (taskId: string, subtaskId: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="border rounded-lg p-3 space-y-3 bg-card shadow-sm group hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
                <div {...attributes} {...listeners} className="mt-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground touch-none">
                    <GripVertical className="h-4 w-4" />
                </div>

                <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1.5"
                />

                <div className="flex-1 min-w-0">
                    <Input
                        value={task.text}
                        onChange={(e) => updateTaskText(task.id, e.target.value)}
                        className={cn(
                            "h-auto py-1 px-2 border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input transition-all text-sm font-medium",
                            task.completed && "line-through text-muted-foreground decoration-2"
                        )}
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Subtasks */}
            <div className="pl-12 space-y-2">
                {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 group/sub">
                        <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                            className="h-3 w-3"
                        />
                        <Input
                            value={subtask.text}
                            onChange={(e) => updateSubtaskText(task.id, subtask.id, e.target.value)}
                            className={cn(
                                "h-6 py-0 px-1.5 text-xs border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input transition-all flex-1",
                                subtask.completed && "line-through text-muted-foreground"
                            )}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                            onClick={() => deleteSubtask(task.id, subtask.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2">
                    <Input
                        className="h-7 text-xs bg-transparent border-transparent hover:border-input focus:border-input placeholder:text-muted-foreground/50"
                        placeholder="+ Add subtask"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addSubtask(task.id, e.currentTarget.value);
                                e.currentTarget.value = "";
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export function TaskList({ project }: { project: any }) {
    // Sort logic: Primary by sort_priority (asc), Secondary by createdAt (desc)
    const sortTasks = (taskList: Task[]) => {
        return [...taskList].sort((a, b) => {
            const pA = a.sort_priority ?? Number.MAX_SAFE_INTEGER;
            const pB = b.sort_priority ?? Number.MAX_SAFE_INTEGER;

            // If priorities differ and are defined, use them
            if (pA !== pB) {
                return pA - pB;
            }

            // Fallback: Newest first (descending)
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    };

    const [tasks, setTasks] = useState<Task[]>(() => sortTasks(project.tasks || []));
    const [newTaskText, setNewTaskText] = useState("");
    const [saving, setSaving] = useState(false);

    // Refs for safe-guarding active edits against prop echoes
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mutatedAtRef = useRef<number>(0);

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental drags on clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync props with local state
    // We only accept external updates if we haven't modified local state recently.
    // This prevents the "Echo" problem where Firestore confirms our write with an "older" version 
    // of the data (e.g. while we are still typing), causing the cursor to jump or text to be lost.
    useEffect(() => {
        if (project.tasks) {
            const timeSinceLastMutation = Date.now() - mutatedAtRef.current;
            // Only sync if we haven't touched data in 3 seconds OR if it's the first load
            if (timeSinceLastMutation > 3000 || mutatedAtRef.current === 0) {
                setTasks(prev => {
                    const sortedProps = sortTasks(project.tasks);
                    if (JSON.stringify(prev) === JSON.stringify(sortedProps)) return prev;
                    return sortedProps;
                });
            }
        }
    }, [project.tasks]);


    const saveTasks = (newTasks: Task[], immediate = false) => {
        setTasks(newTasks);
        mutatedAtRef.current = Date.now(); // Mark as locally modified

        setSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const saveFn = async () => {
            try {
                // Ensure we save the exact 'newTasks' snapshot
                await updateDoc(doc(db, "projects", project.id), { tasks: newTasks });
            } catch (e) {
                console.error("Error saving tasks:", e);
            }
            setSaving(false);
        };

        if (immediate) {
            saveFn();
        } else {
            timeoutRef.current = setTimeout(saveFn, 1000);
        }
    };

    // --- Actions ---

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Correct Pattern: Calculate -> Set State -> Save
            // We need access to current tasks. 'tasks' in closure might be stale if we relied on updater.
            // But since 'tasks' is a dependency of handleDragEnd (re-created), it's fine.

            const oldIndex = tasks.findIndex((t) => t.id === active.id);
            const newIndex = tasks.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(tasks, oldIndex, newIndex);
                const updatedItems = newItems.map((task, index) => ({
                    ...task,
                    sort_priority: index,
                    updatedAt: Date.now()
                }));
                saveTasks(updatedItems, true);
            }
        }
    };

    const addTask = () => {
        if (!newTaskText.trim()) return;
        const now = Date.now();
        // Insert at TOP
        const newTask: Task = {
            id: crypto.randomUUID(),
            text: newTaskText,
            completed: false,
            subtasks: [],
            createdAt: now,
            updatedAt: now,
            sort_priority: 0 // Placeholder
        };

        // Put new task at start, re-index everyone
        const newTasks = [newTask, ...tasks].map((t, i) => ({ ...t, sort_priority: i }));
        saveTasks(newTasks);
        setNewTaskText("");
    };

    const updateTaskText = (taskId: string, text: string) => {
        const newTasks = tasks.map(t =>
            t.id === taskId ? { ...t, text, updatedAt: Date.now() } : t
        );
        saveTasks(newTasks); // Debounced via default
    };

    const toggleTask = (taskId: string) => {
        const newTasks = tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
        );
        saveTasks(newTasks);
    };

    const deleteTask = (taskId: string) => {
        const newTasks = tasks.filter(t => t.id !== taskId);
        // Re-number priorities
        const reordered = newTasks.map((t, i) => ({ ...t, sort_priority: i }));
        saveTasks(reordered);
    };

    const addSubtask = (taskId: string, text: string) => {
        if (!text.trim()) return;
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    updatedAt: Date.now(),
                    subtasks: [...t.subtasks, { id: crypto.randomUUID(), text, completed: false }]
                };
            }
            return t;
        });
        saveTasks(newTasks, true); // Immediate save
    };

    const updateSubtaskText = (taskId: string, subtaskId: string, text: string) => {
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    updatedAt: Date.now(),
                    subtasks: t.subtasks.map(s =>
                        s.id === subtaskId ? { ...s, text } : s
                    )
                };
            }
            return t;
        });
        saveTasks(newTasks); // Debounced
    };

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    updatedAt: Date.now(),
                    subtasks: t.subtasks.map(s =>
                        s.id === subtaskId ? { ...s, completed: !s.completed } : s
                    )
                };
            }
            return t;
        });
        saveTasks(newTasks);
    };

    const deleteSubtask = (taskId: string, subtaskId: string) => {
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    updatedAt: Date.now(),
                    subtasks: t.subtasks.filter(s => s.id !== subtaskId)
                };
            }
            return t;
        });
        saveTasks(newTasks);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="p-4 border-b flex items-center justify-between shadow-sm bg-card/50">
                <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Project Tasks</h3>
                </div>
                <div className="text-xs text-muted-foreground">
                    {saving ? "Saving..." : `${tasks.filter(t => t.completed).length}/${tasks.length} Completed`}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-2xl mx-auto">
                    {/* New Task Input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a new task..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        />
                        <Button onClick={addTask} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Dnd Context */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={tasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {tasks.map(task => (
                                    <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        toggleTask={toggleTask}
                                        deleteTask={deleteTask}
                                        updateTaskText={updateTaskText}
                                        addSubtask={addSubtask}
                                        updateSubtaskText={updateSubtaskText}
                                        toggleSubtask={toggleSubtask}
                                        deleteSubtask={deleteSubtask}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {tasks.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No tasks yet.</p>
                            <p className="text-sm">Add one to get started!</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
