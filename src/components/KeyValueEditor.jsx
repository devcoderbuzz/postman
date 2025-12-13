import { Trash2, Plus } from 'lucide-react';

export function KeyValueEditor({ pairs, setPairs }) {
    const addPair = () => setPairs([...pairs, { key: '', value: '', active: true }]);
    const updatePair = (index, field, value) => {
        const newPairs = [...pairs];
        newPairs[index][field] = value;
        setPairs(newPairs);
    };
    const removePair = (index) => {
        setPairs(pairs.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col border border-neutral-200 dark:border-[var(--border-color)] rounded-lg overflow-hidden bg-white dark:bg-[var(--bg-surface)]">
            <div className="flex border-b border-neutral-200 dark:border-[var(--border-color)] bg-neutral-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <div className="flex-1 p-2 border-r border-neutral-200 dark:border-[var(--border-color)]">Key</div>
                <div className="flex-1 p-2 border-r border-neutral-200 dark:border-[var(--border-color)]">Value</div>
                <div className="w-10"></div>
            </div>
            {pairs.map((pair, index) => (
                <div key={index} className="flex border-b border-neutral-200 dark:border-[var(--border-color)] last:border-0 group">
                    <input
                        className="flex-1 bg-transparent p-2 text-sm outline-none border-r border-neutral-200 dark:border-[var(--border-color)] placeholder:text-neutral-400 dark:placeholder:text-neutral-700 font-mono text-neutral-900 dark:text-[var(--text-primary)]"
                        placeholder="Key"
                        value={pair.key}
                        onChange={(e) => updatePair(index, 'key', e.target.value)}
                    />
                    <input
                        className="flex-1 bg-transparent p-2 text-sm outline-none border-r border-neutral-200 dark:border-[var(--border-color)] placeholder:text-neutral-400 dark:placeholder:text-neutral-700 font-mono text-neutral-900 dark:text-[var(--text-primary)]"
                        placeholder="Value"
                        value={pair.value}
                        onChange={(e) => updatePair(index, 'value', e.target.value)}
                    />
                    <button
                        onClick={() => removePair(index)}
                        className="w-10 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                onClick={addPair}
                className="flex items-center gap-2 p-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add new
            </button>
        </div>
    );
}
