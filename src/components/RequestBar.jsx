import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { VariableAutocomplete } from './VariableAutocomplete';

const METHODS = [
    { value: 'GET', color: 'text-green-500' },
    { value: 'POST', color: 'text-yellow-500' },
    { value: 'PUT', color: 'text-blue-500' },
    { value: 'DELETE', color: 'text-red-500' },
    { value: 'PATCH', color: 'text-purple-500' },
];

export function RequestBar({ method, setMethod, url, setUrl, onSend, isLoading, environments, activeEnv, onEnvSelect }) {
    const currentMethod = METHODS.find(m => m.value === method) || METHODS[0];
    const [autocomplete, setAutocomplete] = useState({
        show: false,
        filterText: '',
        position: { top: 0, left: 0 },
        selectionStart: 0,
        activeIndex: 0
    });

    const activeEnvironment = environments?.find(e => e.id === activeEnv);

    const handleUrlChange = (e) => {
        const val = e.target.value;
        setUrl(val);

        const target = e.target;
        const cursorPos = target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPos);
        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');

        if (lastOpenBraces !== -1 && lastOpenBraces >= textBeforeCursor.lastIndexOf('}}')) {
            const filterText = textBeforeCursor.substring(lastOpenBraces + 2);
            if (!filterText.includes(' ')) {
                const rect = target.getBoundingClientRect();
                setAutocomplete({
                    show: true,
                    filterText,
                    position: {
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.left + window.scrollX
                    },
                    selectionStart: lastOpenBraces,
                    activeIndex: 0
                });
                return;
            }
        }
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    const handleKeyDown = (e) => {
        if (!autocomplete.show) {
            if (e.key === 'Enter') onSend();
            return;
        }

        const items = (activeEnvironment?.variables || []).filter(v =>
            v.key.toLowerCase().includes(autocomplete.filterText.toLowerCase())
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex + 1) % (items.length || 1)
            }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex - 1 + items.length) % (items.length || 1)
            }));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (items[autocomplete.activeIndex]) {
                e.preventDefault();
                handleVariableSelect(items[autocomplete.activeIndex].key);
            }
        } else if (e.key === 'Escape') {
            setAutocomplete(prev => ({ ...prev, show: false }));
        }
    };

    const handleVariableSelect = (varName) => {
        const insertText = `{{${varName}}}`;
        const before = url.substring(0, autocomplete.selectionStart);
        const after = url.substring(autocomplete.selectionStart + autocomplete.filterText.length + 2);
        setUrl(before + insertText + after);
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    return (
        <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-primary)]">
            <div className="flex flex-1 items-center gap-0 bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-300 dark:border-[var(--border-color)] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all shadow-sm">
                <div className="relative group">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className={cn(
                            "bg-transparent pl-4 pr-7 h-[42px] font-bold text-xs outline-none border-r border-slate-300 dark:border-[var(--border-color)] hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer appearance-none uppercase tracking-wide",
                            currentMethod.color
                        )}
                    >
                        {METHODS.map(m => (
                            <option key={m.value} value={m.value} className="text-slate-900 dark:text-[var(--text-primary)] bg-white dark:bg-[var(--bg-surface)]">
                                {m.value}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>

                <input
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter request URL or paste text"
                    className="flex-1 h-[42px] bg-transparent px-4 outline-none text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200"
                />
            </div>

            <div className="flex items-center gap-2">
                {environments && (
                    <div className="relative min-w-[160px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-slate-200 dark:border-slate-700 pr-2">
                            <Globe className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <select
                            value={activeEnv || ''}
                            onChange={(e) => onEnvSelect(e.target.value || null)}
                            className="w-full h-[42px] bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-300 dark:border-[var(--border-color)] text-slate-900 dark:text-[var(--text-primary)] rounded-lg pl-12 pr-8 text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">No Env</option>
                            {environments.map(env => (
                                <option key={env.id} value={env.id}>{env.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                )}

                <button
                    onClick={onSend}
                    disabled={isLoading}
                    className={`px-8 h-[42px] bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20 flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
                </button>
            </div>

            {autocomplete.show && (
                <VariableAutocomplete
                    variables={activeEnvironment?.variables}
                    filterText={autocomplete.filterText}
                    type="variable"
                    onSelect={handleVariableSelect}
                    position={autocomplete.position}
                    activeIndex={autocomplete.activeIndex}
                    onCancel={() => setAutocomplete(prev => ({ ...prev, show: false }))}
                />
            )}
        </div>
    );
}

