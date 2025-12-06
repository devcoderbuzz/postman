import { Clock, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function HistoryPanel({ history, onLoadRequest, onClearHistory }) {
    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                <Clock className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">No request history yet</p>
                <p className="text-xs mt-2">Your recent requests will appear here</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900/30">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Request History</h2>
                <button
                    onClick={onClearHistory}
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="flex-1 overflow-auto p-2">
                <div className="space-y-1">
                    {history.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-3 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded group cursor-pointer border border-neutral-200 dark:border-neutral-800"
                            onClick={() => onLoadRequest(item)}
                        >
                            <span className={cn(
                                "text-[10px] font-bold uppercase w-14 flex-shrink-0",
                                item.method === 'GET' && "text-green-500",
                                item.method === 'POST' && "text-yellow-500",
                                item.method === 'PUT' && "text-blue-500",
                                item.method === 'DELETE' && "text-red-500",
                                item.method === 'PATCH' && "text-purple-500"
                            )}>
                                {item.method}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate font-mono">{item.url}</p>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 mt-0.5">{item.timestamp}</p>
                            </div>
                            <div className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded",
                                item.status >= 200 && item.status < 300 && "bg-green-900/30 text-green-400",
                                item.status >= 400 && "bg-red-900/30 text-red-400"
                            )}>
                                {item.status || '---'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
