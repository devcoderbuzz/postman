import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Globe, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';

export function EnvironmentManager({
    environments,
    commonEnvironment,
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
    onRenameEnv,
    onDeleteEnv,
    readOnly = false
}) {
    const [editingEnv, setEditingEnv] = useState(null);
    const [editingName, setEditingName] = useState('');

    const startEditing = (env) => {
        setEditingEnv(env.id);
        setEditingName(env.name);
    };

    const addEnvironment = () => {
        const newEnv = {
            id: Date.now().toString(),
            name: 'New Environment',
            variables: [{ key: '', value: '' }]
        };
        setEnvironments([...environments, newEnv]);
        startEditing(newEnv);
        setActiveEnv(newEnv.id);
    };

    const saveEnvName = (envId, originalName) => {
        if (onRenameEnv) {
            // Pass (id, newName, oldName)
            // editingName is the NEW name (from input)
            // originalName (env.name) is the OLD name (from props, untouched)
            onRenameEnv(envId, editingName, originalName);
        } else {
            // If no handler, just update local state (fallback behavior)
            setEnvironments(environments.map(env =>
                env.id === envId ? { ...env, name: editingName } : env
            ));
        }
        setEditingEnv(null);
        setEditingName('');
    };

    const deleteEnvironment = (id) => {
        const envToDelete = environments.find(env => env.id === id);
        if (onDeleteEnv && envToDelete) {
            onDeleteEnv(id, envToDelete.name);
        } else {
            setEnvironments(environments.filter(env => env.id !== id));
            if (activeEnv === id) {
                setActiveEnv(null);
            }
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-[var(--text-secondary)] flex items-center gap-2 uppercase tracking-tight">
                    <Globe className="w-4 h-4 text-red-500" />
                    Environments
                </h3>
                {!readOnly && (
                    <button
                        onClick={addEnvironment}
                        className="p-1.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.3)] active:scale-90"
                        title="Add Environment"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5px]" />
                    </button>
                )}
            </div>

            {
                projects && projects.length > 0 && projects[0].id !== 'default' && (
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
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[14px] outline-none focus:border-red-500/50"
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
                )
            }

            <div className="flex-1 overflow-auto space-y-1">
                {environments.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-[var(--border-color)] rounded-xl">
                        <Globe className="w-8 h-8 text-slate-300 dark:text-slate-800 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-medium">No environments found</p>
                    </div>
                ) : (
                    environments.map(env => (
                        <div
                            key={env.id}
                            onClick={() => editingEnv !== env.id && setActiveEnv(env.id)}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border cursor-pointer relative overflow-hidden",
                                activeEnv === env.id
                                    ? "bg-gradient-to-r from-red-50 to-white dark:from-red-900/10 dark:to-[var(--bg-secondary)] border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 shadow-md shadow-red-500/5 ring-1 ring-red-500/10"
                                    : "bg-white dark:bg-[var(--bg-secondary)] border-slate-100 dark:border-[var(--border-color)] hover:border-red-200 dark:hover:border-red-900/30 hover:bg-slate-50/50 dark:hover:bg-red-900/5 hover:shadow-sm"
                            )}
                        >
                            {/* Active Indicator Bar */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300",
                                activeEnv === env.id ? "bg-red-500 scale-y-100" : "bg-transparent scale-y-0"
                            )} />

                            <div className="flex-1 flex items-center min-w-0 z-10">
                                {editingEnv === env.id ? (
                                    <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveEnvName(env.id, env.name);
                                                if (e.key === 'Escape') { setEditingEnv(null); setEditingName(''); }
                                            }}
                                            className="flex-1 bg-white dark:bg-[var(--bg-surface)] border border-red-400 dark:border-red-500 rounded-lg px-2.5 py-1.5 text-sm outline-none shadow-inner dark:text-white"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => saveEnvName(env.id, env.name)}
                                            className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm active:scale-90"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className={cn(
                                        "flex-1 text-sm truncate transition-colors duration-200",
                                        activeEnv === env.id ? "font-bold" : "font-medium text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400"
                                    )}>
                                        {env.name}
                                    </span>
                                )}
                            </div>

                            {editingEnv !== env.id && !readOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startEditing(env); }}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                                        title="Rename"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id); }}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
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
        </div >
    );
}
