import { useState } from 'react';
import { cn } from '../lib/utils';
import { VariableAutocomplete } from './VariableAutocomplete';

const AUTH_TYPES = ['none', 'bearer', 'basic', 'api-key'];

export function AuthEditor({ authType, setAuthType, authData, setAuthData, environments, activeEnv }) {
    const [autocomplete, setAutocomplete] = useState({
        show: false,
        filterText: '',
        position: { top: 0, left: 0 },
        field: '',
        selectionStart: 0,
        activeIndex: 0
    });

    const activeEnvironment = environments?.find(e => e.id === activeEnv);

    const updateAuthData = (key, value) => {
        setAuthData({ ...authData, [key]: value });
    };

    const handleInputChange = (field, value, e) => {
        updateAuthData(field, value);

        const target = e.target;
        const cursorPos = target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');

        if (lastOpenBraces !== -1 && lastOpenBraces >= textBeforeCursor.lastIndexOf('}}')) {
            const filterText = textBeforeCursor.substring(lastOpenBraces + 2);
            if (!filterText.includes(' ')) {
                const rect = target.getBoundingClientRect();
                setAutocomplete({
                    show: true,
                    filterText,
                    position: {
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.left + window.scrollX
                    },
                    field: field,
                    selectionStart: lastOpenBraces,
                    activeIndex: 0
                });
                return;
            }
        }
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    const handleKeyDown = (e) => {
        if (!autocomplete.show) return;

        const items = (activeEnvironment?.variables || []).filter(v =>
            v.key.toLowerCase().includes(autocomplete.filterText.toLowerCase())
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex + 1) % (items.length || 1)
            }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex - 1 + items.length) % (items.length || 1)
            }));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (items[autocomplete.activeIndex]) {
                e.preventDefault();
                handleVariableSelect(items[autocomplete.activeIndex].key);
            }
        } else if (e.key === 'Escape') {
            setAutocomplete(prev => ({ ...prev, show: false }));
        }
    };

    const handleVariableSelect = (varName) => {
        const insertText = `{{${varName}}}`;
        const currentValue = authData[autocomplete.field] || '';
        const before = currentValue.substring(0, autocomplete.selectionStart);
        const after = currentValue.substring(autocomplete.selectionStart + autocomplete.filterText.length + 2);
        updateAuthData(autocomplete.field, before + insertText + after);
        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {AUTH_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setAuthType(type)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                            authType === type
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                        )}
                    >
                        {type === 'api-key' ? 'API Key' : type}
                    </button>
                ))}
            </div>

            {authType === 'none' && (
                <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                    No authentication
                </div>
            )}

            {authType === 'bearer' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Token</span>
                        <input
                            type="text"
                            value={authData.token || ''}
                            onChange={(e) => handleInputChange('token', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter bearer token or {{variable}}"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        />
                    </label>
                </div>
            )}

            {authType === 'basic' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Username</span>
                        <input
                            type="text"
                            value={authData.username || ''}
                            onChange={(e) => handleInputChange('username', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter username or {{variable}}"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Password</span>
                        <input
                            type="password"
                            value={authData.password || ''}
                            onChange={(e) => handleInputChange('password', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter password or {{variable}}"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        />
                    </label>
                </div>
            )}

            {authType === 'api-key' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Key</span>
                        <input
                            type="text"
                            value={authData.key || ''}
                            onChange={(e) => handleInputChange('key', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., X-API-Key or {{variable}}"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Value</span>
                        <input
                            type="text"
                            value={authData.value || ''}
                            onChange={(e) => handleInputChange('value', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter API key value or {{variable}}"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-slate-500 mb-1 block">Add to</span>
                        <select
                            value={authData.addTo || 'header'}
                            onChange={(e) => updateAuthData('addTo', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        >
                            <option value="header">Header</option>
                            <option value="query">Query Params</option>
                        </select>
                    </label>
                </div>
            )}

            {autocomplete.show && (
                <VariableAutocomplete
                    variables={activeEnvironment?.variables}
                    filterText={autocomplete.filterText}
                    type="variable"
                    onSelect={handleVariableSelect}
                    position={autocomplete.position}
                    activeIndex={autocomplete.activeIndex}
                    onCancel={() => setAutocomplete(prev => ({ ...prev, show: false }))}
                />
            )}
        </div>
    );
}
