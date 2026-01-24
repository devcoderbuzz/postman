import { useState, useRef, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { cn, replaceEnvVariables } from '../lib/utils';
import { VariableAutocomplete } from './VariableAutocomplete';

export function KeyValueEditor({ pairs, setPairs, environments, activeEnv }) {
    const [autocomplete, setAutocomplete] = useState({
        show: false,
        filterText: '',
        position: { top: 0, left: 0 },
        field: '', // 'key' or 'value'
        index: null,
        selectionStart: 0,
        activeIndex: 0
    });

    const [keyWidth, setKeyWidth] = useState(40);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const percentage = (offsetX / rect.width) * 100;
            if (percentage >= 10 && percentage <= 80) {
                setKeyWidth(percentage);
            }
        };
        const handleMouseUp = () => setIsResizing(false);
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const activeEnvironment = environments?.find(e => e.id === activeEnv);

    const addPair = () => setPairs([...pairs, { key: '', value: '', active: true }]);
    const updatePair = (index, field, value) => {
        const newPairs = [...pairs];
        newPairs[index][field] = value;
        setPairs(newPairs);
    };

    const handleInputChange = (index, field, value, e) => {
        updatePair(index, field, value);

        const target = e.target;
        const cursorPos = target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
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
                    field: field,
                    index: index,
                    selectionStart: lastOpenBraces,
                    activeIndex: 0
                });
                return;
            }
        }
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    const handleKeyDown = (e) => {
        if (!autocomplete.show) return;

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
        const currentPair = pairs[autocomplete.index];
        const currentValue = currentPair[autocomplete.field] || '';
        const before = currentValue.substring(0, autocomplete.selectionStart);
        const after = currentValue.substring(autocomplete.selectionStart + autocomplete.filterText.length + 2);

        updatePair(autocomplete.index, autocomplete.field, before + insertText + after);
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    const removePair = (index) => {
        setPairs(pairs.filter((_, i) => i !== index));
    };

    return (
        <div ref={containerRef} className="flex flex-col border border-slate-200 dark:border-[var(--border-color)] rounded-lg overflow-hidden bg-white dark:bg-[var(--bg-surface)]">
            <div className="flex border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="p-2 border-r border-slate-200 dark:border-[var(--border-color)] relative group" style={{ width: `${keyWidth}%` }}>
                    Key
                    <div
                        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-red-500/50 transition-colors z-10"
                    />
                </div>
                <div className="flex-1 p-2 border-r border-slate-200 dark:border-[var(--border-color)]">Value</div>
                <div className="w-10"></div>
            </div>
            {pairs.map((pair, index) => (
                <div key={index} className="flex border-b border-slate-200 dark:border-[var(--border-color)] last:border-0 group items-start min-h-[38px]">
                    <textarea
                        rows={1}
                        className="bg-transparent p-2 text-sm outline-none border-r border-slate-200 dark:border-[var(--border-color)] placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-slate-900 dark:text-[var(--text-primary)] resize-none overflow-hidden"
                        style={{ width: `${keyWidth}%` }}
                        placeholder="Key"
                        value={pair.key}
                        onChange={(e) => {
                            handleInputChange(index, 'key', e.target.value, e);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-[var(--border-color)]">
                        <textarea
                            rows={1}
                            className="w-full bg-transparent p-2 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-slate-900 dark:text-[var(--text-primary)] resize-none overflow-hidden"
                            placeholder="Value"
                            value={pair.value}
                            onChange={(e) => {
                                handleInputChange(index, 'value', e.target.value, e);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        {pair.value && pair.value.includes('{{') && (
                            <div className="px-2 pb-1.5 truncate">
                                <span className="text-[10px] text-slate-400 italic">
                                    {replaceEnvVariables(pair.value, activeEnvironment)}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => removePair(index)}
                        className="w-10 h-9 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                onClick={addPair}
                className="flex items-center gap-2 p-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add new
            </button>

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
