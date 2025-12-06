import { cn } from '../lib/utils';

const AUTH_TYPES = ['none', 'bearer', 'basic', 'api-key'];

export function AuthEditor({ authType, setAuthType, authData, setAuthData }) {
    const updateAuthData = (key, value) => {
        setAuthData({ ...authData, [key]: value });
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {AUTH_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setAuthType(type)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                            authType === type
                                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        )}
                    >
                        {type === 'api-key' ? 'API Key' : type}
                    </button>
                ))}
            </div>

            {authType === 'none' && (
                <div className="flex items-center justify-center h-32 text-neutral-400 dark:text-neutral-500 text-sm">
                    No authentication
                </div>
            )}

            {authType === 'bearer' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Token</span>
                        <input
                            type="text"
                            value={authData.token || ''}
                            onChange={(e) => updateAuthData('token', e.target.value)}
                            placeholder="Enter bearer token"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm font-mono text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        />
                    </label>
                </div>
            )}

            {authType === 'basic' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Username</span>
                        <input
                            type="text"
                            value={authData.username || ''}
                            onChange={(e) => updateAuthData('username', e.target.value)}
                            placeholder="Enter username"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Password</span>
                        <input
                            type="password"
                            value={authData.password || ''}
                            onChange={(e) => updateAuthData('password', e.target.value)}
                            placeholder="Enter password"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        />
                    </label>
                </div>
            )}

            {authType === 'api-key' && (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Key</span>
                        <input
                            type="text"
                            value={authData.key || ''}
                            onChange={(e) => updateAuthData('key', e.target.value)}
                            placeholder="e.g., X-API-Key"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm font-mono text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Value</span>
                        <input
                            type="text"
                            value={authData.value || ''}
                            onChange={(e) => updateAuthData('value', e.target.value)}
                            placeholder="Enter API key value"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm font-mono text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-neutral-500 mb-1 block">Add to</span>
                        <select
                            value={authData.addTo || 'header'}
                            onChange={(e) => updateAuthData('addTo', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 text-sm text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                        >
                            <option value="header">Header</option>
                            <option value="query">Query Params</option>
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}
