import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function RequestTabs({ requests, activeRequestId, onActivate, onClose, onAdd }) {
    return (
        <div className="flex items-center bg-slate-100 dark:bg-[var(--bg-secondary)] overflow-x-auto no-scrollbar">
            {requests.map((req, index) => (
                <div
                    key={req.id}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-1.5 min-w-[80px] max-w-[180px] text-[11px] cursor-pointer select-none transition-all relative",
                        req.id === activeRequestId
                            ? "bg-white dark:bg-[var(--bg-primary)] text-slate-900 dark:text-[var(--text-primary)] z-10 border-t-2 border-t-red-500 shadow-sm"
                            : "text-slate-500 hover:bg-slate-300/30 dark:hover:bg-white/5"
                    )}
                    onClick={() => onActivate(req.id)}
                >
                    {/* Middle line separator */}
                    {index < requests.length - 1 && req.id !== activeRequestId && requests[index + 1]?.id !== activeRequestId && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-3 bg-slate-400/30 dark:bg-slate-600/50" />
                    )}

                    <span className={cn(
                        "font-bold text-[10px] shrink-0",
                        req.method === 'GET' && "text-green-500",
                        req.method === 'POST' && "text-yellow-500",
                        req.method === 'PUT' && "text-blue-500",
                        req.method === 'DELETE' && "text-red-500",
                        req.method === 'PATCH' && "text-purple-500",
                    )}>{req.method}</span>
                    <span className="flex-1 truncate font-medium">{req.name || req.url || 'New Request'}</span>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose(req.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-slate-500"
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={onAdd}
                className="p-2 mx-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors rounded-lg"
                title="Create new request"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
