import { History, LayoutGrid, Settings, Box, Folder, Globe, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';

export function Sidebar({ activeView, setActiveView }) {
    const toggleView = (view) => {
        if (activeView === view) {
            // If clicking the same view, don't do anything (it's already active)
            return;
        } else {
            setActiveView(view);
        }
    };

    return (
        <div className="w-12 flex flex-col items-center py-2 bg-neutral-50 dark:bg-[var(--bg-sidebar)] border-r border-neutral-200 dark:border-[var(--border-color)] text-neutral-500 dark:text-neutral-400">
            <div className="p-1 mb-2 text-orange-500">
                <Box className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2 w-full px-2 flex-1 overflow-y-auto no-scrollbar">
                <SidebarItem
                    icon={History}
                    label="History"
                    active={activeView === 'history'}
                    onClick={() => toggleView('history')}
                />
                <SidebarItem
                    icon={Folder}
                    label="Collections"
                    active={activeView === 'collections'}
                    onClick={() => toggleView('collections')}
                />
                <SidebarItem
                    icon={Database}
                    label="Edit Data"
                    active={activeView === 'editData'}
                    onClick={() => toggleView('editData')}
                />
                <SidebarItem
                    icon={Globe}
                    label="Environments"
                    active={activeView === 'environments'}
                    onClick={() => toggleView('environments')}
                />
                <div className="flex-1" />
                <SidebarItem
                    icon={Settings}
                    label="Settings"
                    active={activeView === 'settings'}
                    onClick={() => toggleView('settings')}
                />
            </div>
        </div>
    );
}

// eslint-disable-next-line no-unused-vars
function SidebarItem({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-lg flex justify-center transition-all group relative",
                active ? "bg-neutral-200 dark:bg-[var(--accent-primary)] text-neutral-900 dark:text-white" : "hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"
            )}
            title={label}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
