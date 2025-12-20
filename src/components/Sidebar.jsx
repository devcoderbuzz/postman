import { History, LayoutGrid, Settings, Box, Folder, Globe, Database, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar({ activeView, setActiveView }) {
    const { user } = useAuth();

    const toggleView = (view) => {
        if (activeView === view) {
            // If clicking the same view, don't do anything (it's already active)
            return;
        } else {
            setActiveView(view);
        }
    };

    return (
        <div className="w-12 flex flex-col items-center py-2 bg-slate-50 dark:bg-[var(--bg-sidebar)] border-r border-slate-200 dark:border-[var(--border-color)] text-slate-500 dark:text-slate-400">

            <div className="flex flex-col gap-2 w-full px-2 flex-1 overflow-y-auto no-scrollbar">
                {/* Admin specific items */}
                {user && user.role === 'admin' && (
                    <SidebarItem
                        icon={Users}
                        label="Users"
                        active={activeView === 'users'}
                        onClick={() => toggleView('users')}
                    />
                )}

                {(!user || user.role !== 'admin') && (
                    <>
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
                    </>
                )}
                {user && user.role !== 'user' && (
                    <SidebarItem
                        icon={Database}
                        label="My App Codes"
                        active={activeView === 'appcodes' || activeView === 'editData'}
                        onClick={() => toggleView(user.role === 'admin' ? 'appcodes' : 'editData')}
                    />
                )}
                {(!user || user.role !== 'admin') && (
                    <SidebarItem
                        icon={Globe}
                        label="Environments"
                        active={activeView === 'environments'}
                        onClick={() => toggleView('environments')}
                    />
                )}
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
                active ? "bg-slate-200 dark:bg-[var(--accent-primary)] text-slate-900 dark:text-white" : "hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            )}
            title={label}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
