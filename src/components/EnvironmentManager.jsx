import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Globe, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';

export function EnvironmentManager({
    environments,
    setEnvironments,
    activeEnv,
    setActiveEnv,
    projects,
    activeAppCode,
    onAppCodeSelect,
    onRefreshAppCode,
    modules,
    activeModule,
    onModuleSelect,
    onRefreshModule,
    onRenameEnv
}) {
    const [editingEnv, setEditingEnv] = useState(null);

    const addEnvironment = () => {
        const newEnv = {
            id: Date.now().toString(),
            name: 'New Environment',
            variables: [{ key: '', value: '' }]
        };
        setEnvironments([...environments, newEnv]);
        setEditingEnv(newEnv.id);
        setActiveEnv(newEnv.id);
    };

    const updateEnvName = (id, name) => {
        setEnvironments(environments.map(env =>
            env.id === id ? { ...env, name } : env
        ));
    };

    const deleteEnvironment = (id) => {
        setEnvironments(environments.filter(env => env.id !== id));
        if (activeEnv === id) {
            setActiveEnv(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-[var(--text-secondary)] flex items-center gap-2 uppercase tracking-tight">
                    <Globe className="w-4 h-4 text-red-500" />
                    Environments
                </h3>
                <button
                    onClick={addEnvironment}
                    className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    title="Add Environment"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {projects && projects.length > 0 && projects[0].id !== 'default' && (
                <div className="p-2 bg-slate-100 dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200 dark:border-[var(--border-color)] space-y-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-slate-500 w-16 text-right whitespace-nowrap">App Code:</span>
                        <select
                            value={activeAppCode}
                            onChange={(e) => onAppCodeSelect(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[14px] outline-none focus:border-red-500/50"
                        >
                            {projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={onRefreshAppCode}
                            className="p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition-colors shadow-sm"
                            title="Refresh App Code"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                    {modules && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-slate-500 w-16 text-right whitespace-nowrap">Module:</span>
                            <div className="flex-1 flex gap-1.5">
                                <select
                                    value={activeModule}
                                    onChange={(e) => onModuleSelect(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[14px] outline-none focus:border-red-500/50 appearance-none"
                                >
                                    {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={onRefreshModule}
                                    className="p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition-colors shadow-sm"
                                    title="Refresh Module"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-auto space-y-1">
                {environments.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-[var(--border-color)] rounded-xl">
                        <Globe className="w-8 h-8 text-slate-300 dark:text-slate-800 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-500 text-xs">No environments yet</p>
                    </div>
                ) : (
                    environments.map(env => (
                        <div
                            key={env.id}
                            className={cn(
                                "group flex items-center gap-2 p-2 rounded-xl transition-all border",
                                activeEnv === env.id
                                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400"
                                    : "bg-white dark:bg-[var(--bg-secondary)] border-slate-100 dark:border-[var(--border-color)] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
                            )}
                        >
                            <div className="flex-1 flex items-center min-w-0">
                                {editingEnv === env.id ? (
                                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={env.name}
                                            onChange={(e) => updateEnvName(env.id, e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    if (onRenameEnv) {
                                                        onRenameEnv(env.id, env.name);
                                                    }
                                                    setEditingEnv(null);
                                                }
                                                if (e.key === 'Escape') setEditingEnv(null);
                                            }}
                                            className="flex-1 bg-white dark:bg-[var(--bg-surface)] border border-red-400 dark:border-red-500 rounded px-2 py-1 text-sm outline-none shadow-sm dark:text-white"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (onRenameEnv) {
                                                    onRenameEnv(env.id, env.name);
                                                }
                                                setEditingEnv(null);
                                            }}
                                            className="p-1 text-green-500"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveEnv(env.id)}
                                        className="flex-1 text-left font-semibold text-sm truncate"
                                    >
                                        {env.name}
                                    </button>
                                )}
                            </div>

                            {editingEnv !== env.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingEnv(env.id); }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Rename"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id); }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
