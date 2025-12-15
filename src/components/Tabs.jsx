import { cn } from '../lib/utils';

export function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                            ? 'border-red-600 text-red-600 dark:text-red-500'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
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
