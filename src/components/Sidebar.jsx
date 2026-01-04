import { History, LayoutGrid, Settings, Box, Folder, Globe, Database, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar({ activeView, setActiveView, onRefresh }) {
    const { user } = useAuth();

    const toggleView = (view) => {
        if (activeView === view) {
            if (onRefresh) onRefresh(view);
            return;
        } else {
            setActiveView(view);
        }
    };

    return (
        <div className="w-12 flex flex-col items-center py-2 bg-slate-50 dark:bg-[var(--bg-sidebar)] border-r border-slate-200 dark:border-[var(--border-color)] text-slate-500 dark:text-slate-400">

            <div className="flex flex-col gap-2 w-full px-2 flex-1 overflow-y-auto no-scrollbar">
                {/* Admin specific items */}
                {user && user.role?.toLowerCase() === 'admin' && (
                    <>
                        <SidebarItem
                            icon={Users}
                            label="Users"
                            active={activeView === 'users'}
                            onClick={() => toggleView('users')}
                        />
                        <SidebarItem
                            icon={LayoutGrid}
                            label="App Codes"
                            active={activeView === 'manageAppCodes'}
                            onClick={() => toggleView('manageAppCodes')}
                        />
                    </>
                )}

                {(!user || user.role?.toLowerCase() !== 'admin') && (
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
                {user && user.role?.toLowerCase() !== 'user' && (
                    <SidebarItem
                        icon={Database}
                        label={user.role?.toLowerCase() === 'admin' ? "Collection Details" : "My App Codes"}
                        active={activeView === 'appcodes' || activeView === 'editData'}
                        onClick={() => toggleView(user.role?.toLowerCase() === 'admin' ? 'appcodes' : 'editData')}
                    />
                )}
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
                active ? "bg-slate-200 dark:bg-[var(--accent-primary)] text-slate-900 dark:text-white" : "hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            )}
            title={label}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
