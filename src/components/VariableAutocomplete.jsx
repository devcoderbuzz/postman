import React, { useRef, useEffect } from 'react';
import { Globe, FileText } from 'lucide-react';

export function VariableAutocomplete({ variables, standardHeaders, filterText, type, onSelect, position, activeIndex, onCancel }) {
    let items = [];
    let title = 'Suggestions';
    let icon = <Globe className="w-3 h-3 text-red-500" />;

    if (type === 'variable') {
        items = (variables || []).filter(v => v.active !== false).map(v => ({ key: v.key, value: v.value, isVar: true }));
        title = 'Environment Variables';
    } else if (type === 'header') {
        items = (standardHeaders || []).map(h => ({ key: h, value: 'Standard Header', isVar: false }));
        title = 'Standard Headers';
        icon = <FileText className="w-3 h-3 text-blue-500" />;
    }

    const filtered = items.filter(v =>
        v.key.toLowerCase().includes(filterText.toLowerCase())
    );

    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onCancel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onCancel]);

    useEffect(() => {
        if (containerRef.current && activeIndex >= 0) {
            const activeElement = containerRef.current.querySelectorAll('button')[activeIndex];
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    if (filtered.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="absolute z-[100] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-lg overflow-hidden min-w-[240px] max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: position.top,
                left: position.left,
                width: 'max-content'
            }}
        >
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
                </div>
                <span className="text-[9px] text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                    {filtered.length} matches
                </span>
            </div>
            <div className="flex flex-col py-1">
                {filtered.map((v, i) => (
                    <button
                        key={v.key}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelect(v.key, v.isVar);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between group transition-all border-l-2 ${i === activeIndex
                            ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30 text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        <div className="flex flex-col overflow-hidden mr-4">
                            <span className={`font-mono font-bold truncate ${i === activeIndex ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-200'}`}>
                                {v.key}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate mt-0.5">
                                {v.value}
                            </span>
                        </div>
                        {i === activeIndex && <span className="text-[9px] text-red-500 dark:text-red-400 font-bold opacity-60">↵</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
