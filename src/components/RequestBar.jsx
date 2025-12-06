import { Send, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const METHODS = [
    { value: 'GET', color: 'text-green-500' },
    { value: 'POST', color: 'text-yellow-500' },
    { value: 'PUT', color: 'text-blue-500' },
    { value: 'DELETE', color: 'text-red-500' },
    { value: 'PATCH', color: 'text-purple-500' },
];

export function RequestBar({ method, setMethod, url, setUrl, onSend, isLoading }) {
    const currentMethod = METHODS.find(m => m.value === method) || METHODS[0];

    return (
        <div className="flex items-center gap-2 p-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
            <div className="flex flex-1 items-center gap-0 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden focus-within:border-neutral-500 transition-colors shadow-sm">
                <div className="relative group">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className={cn(
                            "bg-transparent pl-4 pr-8 py-2.5 font-bold text-xs outline-none border-r border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer appearance-none uppercase tracking-wide",
                            currentMethod.color
                        )}
                    >
                        {METHODS.map(m => (
                            <option key={m.value} value={m.value} className="text-neutral-900 dark:text-neutral-300 bg-white dark:bg-neutral-900">
                                {m.value}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
                </div>

                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter request URL"
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm font-mono placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-900 dark:text-neutral-200"
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                />
            </div>
            <button
                onClick={onSend}
                disabled={isLoading}
                className={cn(
                    "px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20",
                    isLoading && "animate-pulse"
                )}
            >
                {isLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
            </button>
        </div>
    );
}
