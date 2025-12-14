import { cn } from '../lib/utils';

export function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-4">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                            ? 'border-red-600 text-red-600 dark:text-red-500'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}
            `}
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
