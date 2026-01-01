import { useState, useRef, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import { Sparkles, ChevronDown } from 'lucide-react';

import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { cn } from '../lib/utils';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('html', xml);

const BODY_TYPES = [
    { id: 'none', label: 'none' },
    { id: 'form-data', label: 'form-data' },
    { id: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
    { id: 'raw', label: 'raw' },
    { id: 'binary', label: 'binary' },
    { id: 'graphql', label: 'GraphQL' },
];

const RAW_TYPES = ['Text', 'JSON', 'HTML', 'XML'];

export function BodyEditor({ bodyType, setBodyType, body, setBody, rawType = 'JSON', setRawType }) {
    const [jsonError, setJsonError] = useState(null);
    const [showRawDropdown, setShowRawDropdown] = useState(false);
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowRawDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleJsonChange = (value) => {
        setBody(value);
        if (rawType === 'JSON') {
            try {
                if (value.trim()) {
                    JSON.parse(value);
                    setJsonError(null);
                } else {
                    setJsonError(null);
                }
            } catch (err) {
                setJsonError(err.message);
            }
        } else {
            setJsonError(null);
        }
    };

    const formatContent = () => {
        try {
            if (!body || !body.trim()) return;

            if (rawType === 'JSON') {
                const parsed = JSON.parse(body);
                setBody(JSON.stringify(parsed, null, 2));
                setJsonError(null);
            } else if (rawType === 'XML' || rawType === 'HTML') {
                // Basic XML/HTML formatting logic
                let formatted = '';
                let indent = '';
                const tab = '  ';
                body.split(/>\s*</).forEach((node) => {
                    if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
                    formatted += indent + '<' + node + '>\n';
                    if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
                });
                setBody(formatted.substring(1, formatted.length - 2).trim());
            }
        } catch (err) {
            console.error("Formatting error:", err);
            if (rawType === 'JSON') setJsonError("Cannot format: " + err.message);
        }
    };

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineNumbers = (body || '').split('\n').map((_, i) => i + 1);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-6 px-1 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-4">
                    {BODY_TYPES.map(type => (
                        <label key={type.id} className="flex items-center gap-1.5 cursor-pointer group">
                            <div
                                onClick={() => setBodyType(type.id)}
                                className={cn(
                                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all",
                                    bodyType === type.id
                                        ? "border-red-500 bg-red-500"
                                        : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400"
                                )}
                            >
                                {bodyType === type.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span
                                onClick={() => setBodyType(type.id)}
                                className={cn(
                                    "text-xs font-medium transition-colors",
                                    bodyType === type.id ? "text-slate-900 dark:text-white" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                )}
                            >
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>

                {bodyType === 'raw' && (
                    <div className="flex items-center gap-3 ml-4 border-l border-slate-200 dark:border-slate-800 pl-4">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowRawDropdown(!showRawDropdown)}
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-500 text-xs font-bold hover:underline uppercase"
                            >
                                {rawType}
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {showRawDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 py-1">
                                    {RAW_TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setRawType(type);
                                                setShowRawDropdown(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-1.5 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                                                rawType === type ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-300"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {rawType !== 'Text' && (
                            <button
                                onClick={formatContent}
                                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium transition-colors border-l border-slate-200 dark:border-slate-800 pl-3 h-4"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                <span>Beautify</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {bodyType === 'none' && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-sm gap-2">
                    <p>This request does not have a body</p>
                </div>
            )}

            {(bodyType === 'raw') && (
                <div className="relative group border border-slate-200 dark:border-[var(--border-color)] rounded-lg overflow-hidden flex bg-white dark:bg-[var(--bg-surface)]">
                    {/* Line Numbers Sidebar */}
                    <div
                        ref={lineNumbersRef}
                        className="w-12 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 text-right pr-3 py-4 text-[13px] font-mono text-slate-400 dark:text-slate-600 select-none overflow-hidden"
                        style={{ lineHeight: '1.5rem' }}
                    >
                        {lineNumbers.map(n => (
                            <div key={n} className="h-6">{n}</div>
                        ))}
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {/* The visible highlighted layer */}
                        <div
                            className="absolute inset-0 pointer-events-none p-4 text-[13px] font-mono leading-[1.5rem] whitespace-pre"
                            style={{
                                color: 'transparent',
                                top: textareaRef.current ? -textareaRef.current.scrollTop : 0
                            }}
                        >
                            <SyntaxHighlighter
                                language={rawType.toLowerCase()}
                                style={document.documentElement.classList.contains('dark') ? atomOneLight : atomOneDark}
                                className="bg-transparent !p-0 !m-0"
                                customStyle={{ background: 'transparent', padding: 0 }}
                            >
                                {body || ' '}
                            </SyntaxHighlighter>
                        </div>

                        {/* The editable transparent layer */}
                        <textarea
                            ref={textareaRef}
                            value={body}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            onScroll={handleScroll}
                            placeholder={rawType === 'JSON' ? '{\n  "key": "value"\n}' : `Enter ${rawType} content...`}
                            className="w-full h-80 bg-transparent p-4 text-[13px] font-mono text-slate-900 dark:text-[var(--text-primary)] caret-slate-900 dark:caret-white outline-none resize-none pr-10 leading-[1.5rem] relative z-10"
                            style={{
                                WebkitTextFillColor: 'transparent',
                                color: 'transparent',
                            }}
                            spellCheck="false"
                        />
                    </div>
                    {jsonError && rawType === 'JSON' && (
                        <div className="absolute bottom-4 left-16 right-4 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded px-2 py-1 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {jsonError}
                        </div>
                    )}
                </div>
            )}

            {(bodyType !== 'none' && bodyType !== 'raw') && (
                <div className="flex items-center justify-center h-48 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-sm italic">
                    {bodyType} editor - coming soon
                </div>
            )}
        </div>
    );
}
