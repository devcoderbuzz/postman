import { Moon, Sun } from 'lucide-react';

export function Settings({ theme, setTheme, layout, setLayout }) {
    return (
        <div className="flex-1 flex flex-col p-8 max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-[var(--text-primary)] mb-4">Appearance</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[var(--bg-secondary)] rounded-lg border border-slate-200 dark:border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 dark:bg-white/5 rounded-lg">
                                {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> : <Sun className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-[var(--text-primary)]">Theme</p>
                                <p className="text-xs text-slate-500">Select your preferred interface theme</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'light'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'dark'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Layout</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                                <span className="text-lg">◫</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Pane Layout</p>
                                <p className="text-xs text-slate-500">Choose how request and response panes are arranged</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setLayout('vertical')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === 'vertical'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Vertical
                            </button>
                            <button
                                onClick={() => setLayout('horizontal')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${layout === 'horizontal'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Horizontal
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">About</h3>
                    <p className="text-sm text-slate-400">
                        Postman Clone v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
