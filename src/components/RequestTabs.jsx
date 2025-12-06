import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function RequestTabs({ requests, activeRequestId, onActivate, onClose, onAdd }) {
    return (
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 overflow-x-auto no-scrollbar">
            {requests.map((req) => (
                <div
                    key={req.id}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] text-xs cursor-pointer border-r border-neutral-200 dark:border-neutral-800 select-none",
                        req.id === activeRequestId
                            ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border-t-2 border-t-blue-500"
                            : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
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
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all text-neutral-500"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
            <button
                onClick={onAdd}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                title="Create new request"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
