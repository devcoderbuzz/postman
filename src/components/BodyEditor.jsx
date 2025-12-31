import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { Sparkles } from 'lucide-react';

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

    const handleBeautify = () => {
        try {
            if (body.trim()) {
                const parsed = JSON.parse(body);
                setBody(JSON.stringify(parsed, null, 2));
                setJsonError(null);
            }
        } catch (err) {
            setJsonError("Cannot beautify: " + err.message);
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {BODY_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setBodyType(type)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize",
                            bodyType === type
                                ? "bg-slate-200 dark:bg-[var(--bg-surface)] text-slate-900 dark:text-[var(--text-primary)]"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {bodyType === 'none' && (
                <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                    No body content
                </div>
            )}

            {bodyType === 'json' && (
                <div className="space-y-2 relative group">
                    <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleBeautify}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                            title="Beautify JSON"
                        >
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            Beautify
                        </button>
                    </div>
                    <textarea
                        value={body}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        placeholder='{\n  "key": "value"\n}'
                        className="w-full h-64 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-color)] rounded-lg p-4 text-sm font-mono text-slate-900 dark:text-[var(--text-primary)] outline-none focus:border-slate-400 dark:focus:border-slate-600 resize-none pr-24"
                    />
                    {jsonError && (
                        <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded p-2">
                            Invalid JSON: {jsonError}
                        </div>
                    )}
                </div>
            )}


            {bodyType === 'form-data' && (
                <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                    Form data editor - Coming soon
                </div>
            )}

            {bodyType === 'raw' && (
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter raw body content..."
                    className="w-full h-64 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-[var(--border-color)] rounded-lg p-4 text-sm font-mono text-slate-900 dark:text-[var(--text-primary)] outline-none focus:border-slate-400 dark:focus:border-slate-600 resize-none"
                />
            )}
        </div>
    );
}
