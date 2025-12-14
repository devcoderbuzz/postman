import { useState } from 'react';
import { Tabs } from './Tabs';
import { Copy, Download, Check } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { cn } from '../lib/utils';
import { buildCurl } from '../lib/curlBuilder';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('javascript', javascript);

export function ResponseViewer({ response, error, isLoading, activeRequest, theme }) {
    const [activeTab, setActiveTab] = useState('body');
    const [viewMode, setViewMode] = useState('pretty');
    const [copied, setCopied] = useState(false);
    const [curlCopied, setCurlCopied] = useState(false);

    const tabs = [
        { id: 'body', label: 'Body' },
        { id: 'headers', label: 'Headers' },
        { id: 'curl', label: 'Curl' },
    ];

    const getLanguage = (contentType) => {
        if (!contentType) return 'json';
        if (contentType.includes('html') || contentType.includes('xml')) return 'xml';
        if (contentType.includes('css')) return 'css';
        if (contentType.includes('javascript')) return 'javascript';
        return 'json';
    };

    const language = response ? getLanguage(response.headers?.['content-type'] || '') : 'json';

    const handleCopy = () => {
        const text = typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!response) return;

        const contentType = response.headers?.['content-type'] || 'application/json';
        let extension = 'json';
        let type = 'application/json';

        if (contentType.includes('html')) {
            extension = 'html';
            type = 'text/html';
        } else if (contentType.includes('xml')) {
            extension = 'xml';
            type = 'application/xml';
        } else if (contentType.includes('text/plain')) {
            extension = 'txt';
            type = 'text/plain';
        } else if (contentType.includes('png')) {
            extension = 'png';
            type = 'image/png';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            extension = 'jpg';
            type = 'image/jpeg';
        }

        const text = typeof response.data === 'boolean' || typeof response.data === 'number'
            ? String(response.data)
            : typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2);

        const blob = new Blob([text], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCurlCopy = () => {
        if (!activeRequest) return;
        const curl = buildCurl(activeRequest);
        navigator.clipboard.writeText(curl);
        setCurlCopied(true);
        setTimeout(() => setCurlCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-sm">Sending request...</p>
                </div>
            </div>
        );
    }

    if (error && !response) {
        return (
            <div className="p-4 text-red-400 bg-red-900/10 rounded-lg border border-red-900/50">
                <h3 className="font-bold mb-2">Error</h3>
                <pre className="text-sm whitespace-pre-wrap">{error.message}</pre>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                <div className="text-6xl mb-4 opacity-50">🚀</div>
                <p>Send a request to see the response here</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 text-xs font-mono mb-3 pb-3 border-b border-neutral-200 dark:border-[var(--border-color)]">
                <div className="flex gap-4">
                    <span className={cn(
                        "font-semibold",
                        response.status >= 200 && response.status < 300 ? "text-green-500" : "text-red-500"
                    )}>
                        {response.status} {response.statusText}
                    </span>
                    <span className="text-neutral-400">⏱ {response.time}ms</span>
                    <span className="text-neutral-400">📦 {response.size}B</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        title="Copy response"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        title="Download response"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'body' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-transparent">
                    <div className="flex gap-2 mb-2 px-2 pt-2">
                        {['pretty', 'raw'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded transition-colors capitalize",
                                    viewMode === mode
                                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                        : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto bg-white dark:bg-transparent relative">
                        {viewMode === 'pretty' ? (
                            <SyntaxHighlighter
                                language={language}
                                style={theme === 'dark' ? atomOneDark : undefined}
                                customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    background: 'transparent',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                }}
                                wrapLines={true}
                            >
                                {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                            </SyntaxHighlighter>
                        ) : (
                            <textarea
                                readOnly
                                value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                                className="w-full h-full resize-none p-4 font-mono text-xs bg-white dark:bg-transparent text-neutral-900 dark:text-neutral-300 outline-none"
                            />
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'headers' && (
                <div className="flex-1 overflow-auto">
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                        {Object.entries(response.headers || {}).map(([key, value]) => (
                            <div key={key} className="flex border-b border-neutral-200 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                <div className="flex-1 p-3 font-mono text-xs text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800">
                                    {key}
                                </div>
                                <div className="flex-1 p-3 font-mono text-xs text-neutral-800 dark:text-neutral-300">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'curl' && activeRequest && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={handleCurlCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors"
                        >
                            {curlCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {curlCopied ? 'Copied' : 'Copy Curl'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <SyntaxHighlighter
                            language="bash"
                            style={atomOneDark}
                            customStyle={{ margin: 0, background: '#0a0a0a', fontSize: '12px', minHeight: '100%' }}
                            showLineNumbers
                            wrapLongLines={true}
                        >
                            {buildCurl(activeRequest)}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}
        </div>
    );
}
