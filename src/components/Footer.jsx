import { Terminal, AppWindow } from 'lucide-react';
import { cn } from '../lib/utils';

export function Footer({ showConsole, onToggleConsole, latestRequest }) {
    return (
        <footer className="h-8 border-t border-slate-200 dark:border-[var(--border-color)] bg-slate-100 dark:bg-[var(--bg-secondary)] flex items-center justify-between px-3 select-none z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleConsole}
                    className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors px-2 py-0.5 rounded",
                        showConsole
                            ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Terminal className="w-3.5 h-3.5" />
                    Console
                </button>

                {latestRequest && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                        <span className={cn(
                            "font-bold",
                            latestRequest.method === 'GET' && "text-green-600 dark:text-green-500",
                            latestRequest.method === 'POST' && "text-yellow-600 dark:text-yellow-500",
                            latestRequest.method === 'PUT' && "text-blue-600 dark:text-blue-500",
                            latestRequest.method === 'DELETE' && "text-red-600 dark:text-red-500"
                        )}>
                            {latestRequest.method}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 max-w-[300px] truncate">
                            {latestRequest.url}
                        </span>
                        {latestRequest.response && (
                            <span className={cn(
                                "font-semibold ml-2",
                                latestRequest.response.status >= 200 && latestRequest.response.status < 300 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                            )}>
                                {latestRequest.response.status}
                            </span>
                        )}
                        {latestRequest.error && (
                            <span className="text-red-500 ml-2">Error</span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1">
                    <AppWindow className="w-3.5 h-3.5" />
                    <span>Postman Studio v1.0.0</span>
                </div>
            </div>
        </footer>
    );
}
