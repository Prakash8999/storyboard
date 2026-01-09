"use client";
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
                </div>
                {children}
            </div>
        </div>
    )
}
