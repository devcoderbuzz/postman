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
        <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-primary)]">
            <div className="flex flex-1 items-center gap-0 bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-300 dark:border-[var(--border-color)] rounded-lg overflow-hidden focus-within:border-slate-500 transition-colors shadow-sm">
                <div className="relative group">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className={cn(
                            "bg-transparent pl-3 pr-6 py-1.5 font-bold text-xs outline-none border-r border-slate-300 dark:border-[var(--border-color)] hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer appearance-none uppercase tracking-wide",
                            currentMethod.color
                        )}
                    >
                        {METHODS.map(m => (
                            <option key={m.value} value={m.value} className="text-slate-900 dark:text-[var(--text-primary)] bg-white dark:bg-[var(--bg-surface)]">
                                {m.value}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>

                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter request URL"
                    className="flex-1 bg-transparent px-3 py-1.5 outline-none text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200"
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                />
            </div>
            <button
                onClick={onSend}
                disabled={isLoading}
                className={`px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {isLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
            </button>
        </div>
    );
}
