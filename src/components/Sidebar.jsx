import { History, LayoutGrid, Settings, Box, Folder, Globe, Database, Users, Shield } from 'lucide-react';
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
        <div className="w-20 flex flex-col py-3 bg-slate-50 dark:bg-[var(--bg-sidebar)] border-r border-slate-200 dark:border-[var(--border-color)] text-slate-500 dark:text-slate-400">

            <div className="flex flex-col gap-2 w-full px-2 flex-1 overflow-y-auto no-scrollbar">
                {user && user.role?.toLowerCase() === 'admin' && (
                    <SidebarItem
                        icon={Shield}
                        label="Management"
                        active={activeView === 'users'}
                        onClick={() => toggleView('users')}
                    />
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
                    label="Env"
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
                "py-2 rounded-lg flex flex-col items-center gap-1 transition-all group relative w-full",
                active ? "bg-slate-200 dark:bg-[var(--accent-primary)] text-slate-900 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            )}
            title={label}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-tight text-center leading-tight px-1">{label}</span>
        </button>
    );
}
