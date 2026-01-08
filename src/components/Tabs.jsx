import { cn } from '../lib/utils';

export function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2 items-center overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap relative flex items-center gap-1.5",
                        activeTab === tab.id
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                >
                    {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                    {tab.suffix && (
                        <span className={cn(
                            "text-[10px] ml-0.5",
                            activeTab === tab.id ? "text-green-600 dark:text-green-500" : "text-green-600/70 dark:text-green-500/70"
                        )}>
                            {tab.suffix}
                        </span>
                    )}
                    {tab.indicator && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />
                    )}
                </button>
            ))}
        </div>
    );
}
