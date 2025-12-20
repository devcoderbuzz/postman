import React from 'react';
import { cn } from '../lib/utils';
import { LogOut } from 'lucide-react';

export function Header({ user, onLogout, theme, setTheme, activeView, setActiveView, profilePic }) {
    return (
        <header className={cn('bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shadow-sm relative z-10')}>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Postman Studio</h1>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none capitalize">{user?.username}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <button
                                onClick={() => setActiveView('settings')}
                                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-red-500/50 transition-all active:scale-95 focus:outline-none"
                            >
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {user?.username?.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <button
                            onClick={onLogout}
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onLogout}
                        className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
}
