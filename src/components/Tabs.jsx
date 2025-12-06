import { cn } from '../lib/utils';

export function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-4">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors relative",
                        activeTab === tab.id ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                    )}
                </button>
            ))}
        </div>
    );
}
