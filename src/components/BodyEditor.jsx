import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';

import { cn } from '../lib/utils';

SyntaxHighlighter.registerLanguage('json', json);

const BODY_TYPES = ['none', 'json', 'form-data', 'raw'];

export function BodyEditor({ bodyType, setBodyType, body, setBody }) {
    const [jsonError, setJsonError] = useState(null);

    const handleJsonChange = (value) => {
        setBody(value);
        try {
            if (value.trim()) {
                JSON.parse(value);
                setJsonError(null);
            }
        } catch (err) {
            setJsonError(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {BODY_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setBodyType(type)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                            bodyType === type
                                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {bodyType === 'none' && (
                <div className="flex items-center justify-center h-32 text-neutral-400 dark:text-neutral-500 text-sm">
                    No body content
                </div>
            )}

            {bodyType === 'json' && (
                <div className="space-y-2">
                    <textarea
                        value={body}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        placeholder='{\n  "key": "value"\n}'
                        className="w-full h-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 text-sm font-mono text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 resize-none"
                    />
                    {jsonError && (
                        <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded p-2">
                            Invalid JSON: {jsonError}
                        </div>
                    )}
                </div>
            )}

            {bodyType === 'form-data' && (
                <div className="flex items-center justify-center h-32 text-neutral-400 dark:text-neutral-500 text-sm">
                    Form data editor - Coming soon
                </div>
            )}

            {bodyType === 'raw' && (
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter raw body content..."
                    className="w-full h-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 text-sm font-mono text-neutral-900 dark:text-neutral-300 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 resize-none"
                />
            )}
        </div>
    );
}
