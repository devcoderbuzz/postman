import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function RequestTabs({ requests, activeRequestId, onActivate, onClose, onAdd }) {
    return (
        <div className="flex items-center border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-100 dark:bg-[var(--bg-secondary)] overflow-x-auto no-scrollbar">
            {requests.map((req) => (
                <div
                    key={req.id}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] text-xs cursor-pointer border-r border-slate-200 dark:border-[var(--border-color)] select-none",
                        req.id === activeRequestId
                            ? "bg-white dark:bg-[var(--bg-primary)] text-slate-900 dark:text-[var(--text-primary)] border-t-2 border-t-blue-500"
                            : "bg-slate-100 dark:bg-[var(--bg-secondary)] text-slate-500 dark:text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-white/5"
                    )}
                    onClick={() => onActivate(req.id)}
                >
                    <span className={cn(
                        "font-bold text-[10px]",
                        req.method === 'GET' && "text-green-500",
                        req.method === 'POST' && "text-yellow-500",
                        req.method === 'PUT' && "text-blue-500",
                        req.method === 'DELETE' && "text-red-500",
                        req.method === 'PATCH' && "text-purple-500",
                    )}>{req.method}</span>
                    <span className="flex-1 truncate">{req.name || req.url || 'New Request'}</span>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(req.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-slate-500"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
            <button
                onClick={onAdd}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Create new request"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
