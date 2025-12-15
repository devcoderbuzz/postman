import React from 'react';
import { cn } from '../lib/utils';

export function Header({ user, onLogout, isSettingsOpen, setIsSettingsOpen, theme, setTheme, activeView, setActiveView }) {
    return (
        <header className={cn('flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-[var(--bg-secondary)] border-b border-slate-200 dark:border-[var(--border-color)] relative')}>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Postman Studio</h1>
            {user && (
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Welcome, {user.username}
                    </span>

                    {/* Settings Dropdown Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none"
                        >
                            Settings
                        </button>
                    </div>

                    <button
                        onClick={onLogout}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        Logout
                    </button>

                    {/* Settings Dropdown Content */}
                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                            <div className="absolute top-10 right-4 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                                <div className="py-1">
                                    <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700 mb-1">Theme</p>
                                    <button
                                        onClick={() => { setTheme('light'); setIsSettingsOpen(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-sm ${theme === 'light' ? 'text-red-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        Light Mode {theme === 'light' && <span>✓</span>}
                                    </button>
                                    <button
                                        onClick={() => { setTheme('dark'); setIsSettingsOpen(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-sm ${theme === 'dark' ? 'text-red-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        Dark Mode {theme === 'dark' && <span>✓</span>}
                                    </button>

                                    <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                    <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700 mb-1">View</p>

                                    {activeView === 'editData' ? (
                                        <button
                                            onClick={() => { setActiveView('collections'); setIsSettingsOpen(false); }}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                                        >
                                            View Collections
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setActiveView('editData'); setIsSettingsOpen(false); }}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                                        >
                                            My App Codes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
            {!user && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={onLogout}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        Sign In
                    </button>
                    {/* Settings Dropdown Trigger for Guest */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none"
                        >
                            Settings
                        </button>
                    </div>
                    {/* Settings Dropdown Content for Guest */}
                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                            <div className="absolute top-10 right-4 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                                <div className="py-1">
                                    <p className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700 mb-1">Theme</p>
                                    <button
                                        onClick={() => { setTheme('light'); setIsSettingsOpen(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-sm ${theme === 'light' ? 'text-red-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        Light Mode {theme === 'light' && <span>✓</span>}
                                    </button>
                                    <button
                                        onClick={() => { setTheme('dark'); setIsSettingsOpen(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-sm ${theme === 'dark' ? 'text-red-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        Dark Mode {theme === 'dark' && <span>✓</span>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
