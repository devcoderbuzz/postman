import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function EnvironmentManager({ environments, setEnvironments, activeEnv, setActiveEnv }) {
    const [editingEnv, setEditingEnv] = useState(null);

    const addEnvironment = () => {
        const newEnv = {
            id: Date.now().toString(),
            name: 'New Environment',
            variables: [{ key: '', value: '' }]
        };
        setEnvironments([...environments, newEnv]);
        setEditingEnv(newEnv.id);
    };

    const updateEnvName = (id, name) => {
        setEnvironments(environments.map(env =>
            env.id === id ? { ...env, name } : env
        ));
    };

    const updateVariable = (envId, index, field, value) => {
        setEnvironments(environments.map(env => {
            if (env.id === envId) {
                const newVars = [...env.variables];
                newVars[index][field] = value;
                return { ...env, variables: newVars };
            }
            return env;
        }));
    };

    const addVariable = (envId) => {
        setEnvironments(environments.map(env => {
            if (env.id === envId) {
                return { ...env, variables: [...env.variables, { key: '', value: '' }] };
            }
            return env;
        }));
    };

    const removeVariable = (envId, index) => {
        setEnvironments(environments.map(env => {
            if (env.id === envId) {
                return { ...env, variables: env.variables.filter((_, i) => i !== index) };
            }
            return env;
        }));
    };

    const deleteEnvironment = (id) => {
        setEnvironments(environments.filter(env => env.id !== id));
        if (activeEnv === id) {
            setActiveEnv(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Environments</h3>
                <button
                    onClick={addEnvironment}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>

            {environments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
                    No environments yet. Create one to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {environments.map(env => (
                        <div
                            key={env.id}
                            className={cn(
                                "border rounded-lg overflow-hidden transition-colors",
                                activeEnv === env.id ? "border-blue-500" : "border-slate-200 dark:border-[var(--border-color)]"
                            )}
                        >
                            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-900/50">
                                {editingEnv === env.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={env.name}
                                            onChange={(e) => updateEnvName(env.id, e.target.value)}
                                            className="flex-1 bg-white dark:bg-[var(--bg-surface)] border border-slate-300 dark:border-[var(--border-color)] rounded px-2 py-1 text-sm outline-none focus:border-slate-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => setEditingEnv(null)}
                                            className="p-1 text-green-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setActiveEnv(env.id)}
                                            className="flex-1 text-left font-medium text-sm"
                                        >
                                            {env.name}
                                            {activeEnv === env.id && (
                                                <span className="ml-2 text-xs text-blue-500">(Active)</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setEditingEnv(env.id)}
                                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteEnvironment(env.id)}
                                            className="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {activeEnv === env.id && (
                                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                                    <div className="space-y-2">
                                        {env.variables.map((variable, index) => (
                                            <div key={index} className="flex gap-2 group">
                                                <input
                                                    type="text"
                                                    value={variable.key}
                                                    onChange={(e) => updateVariable(env.id, index, 'key', e.target.value)}
                                                    placeholder="Variable name"
                                                    className="flex-1 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-color)] rounded px-3 py-2 text-xs font-mono outline-none focus:border-slate-600"
                                                />
                                                <input
                                                    type="text"
                                                    value={variable.value}
                                                    onChange={(e) => updateVariable(env.id, index, 'value', e.target.value)}
                                                    placeholder="Value"
                                                    className="flex-1 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-color)] rounded px-3 py-2 text-xs font-mono outline-none focus:border-slate-600"
                                                />
                                                <button
                                                    onClick={() => removeVariable(env.id, index)}
                                                    className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addVariable(env.id)}
                                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add variable
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Utility function to replace variables in text

