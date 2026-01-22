import { useState } from 'react';
import { Tabs } from './Tabs';
import { Copy, Download, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { cn, replaceEnvVariables } from '../lib/utils';
import { buildCurl } from '../lib/curlBuilder';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('javascript', javascript);

// JsonTree component for custom JSON rendering with consistent colors
function JsonTree({ data, suffix = "" }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (typeof data !== 'object' || data === null) {
        // Primitive values
        const isString = typeof data === 'string';
        return (
            <span className={cn(
                "break-all",
                isString ? "text-green-600 dark:text-[#a8ff60]" : "text-orange-600 dark:text-[#ce9178]"
            )}>
                {isString ? `"${data}"` : String(data)}
                {suffix}
            </span>
        );
    }

    const isArray = Array.isArray(data);
    const openBrace = isArray ? '[' : '{';
    const closeBrace = isArray ? ']' : '}';
    const entries = isArray ? data : Object.entries(data);

    if (entries.length === 0) {
        return <span className="text-slate-900 dark:text-slate-300">{openBrace}{closeBrace}{suffix}</span>;
    }

    // Single line for arrays of primitives
    if (isArray && data.every(item => typeof item !== 'object' || item === null)) {
        return (
            <span className="text-slate-900 dark:text-slate-300">
                [
                {data.map((item, index) => (
                    <JsonTree key={index} data={item} suffix={index === data.length - 1 ? "" : ", "} />
                ))}
                ]{suffix}
            </span>
        );
    }

    return (
        <div className="font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-300">
            <span
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded inline-flex items-center select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 mr-1 text-slate-400" />
                ) : (
                    <ChevronDown className="w-3 h-3 mr-1 text-slate-400" />
                )}
                {openBrace}
                {isCollapsed && (
                    <>
                        <span className="text-slate-400 mx-1">...</span>
                        {closeBrace}
                        {suffix}
                    </>
                )}
            </span>

            {!isCollapsed && (
                <>
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
                        {entries.map((item, index) => {
                            const key = isArray ? null : item[0];
                            const value = isArray ? item : item[1];
                            const isLast = index === entries.length - 1;
                            return (
                                <div key={isArray ? index : key} className="flex">
                                    {key !== null && (
                                        <span className="text-blue-600 dark:text-[#9cdcfe] mr-1">"{key}":</span>
                                    )}
                                    <div className="flex-1">
                                        <JsonTree data={value} suffix={isLast ? "" : ","} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <span>{closeBrace}{suffix}</span>
                </>
            )}
        </div>
    );
}


export function ResponseViewer({ response, error, isLoading, activeRequest, theme, environments, activeEnv }) {
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
        const currentEnv = environments?.find(e => e.id === activeEnv);
        const processedRequest = {
            ...activeRequest,
            url: replaceEnvVariables(activeRequest.url, currentEnv),
            headers: (activeRequest.headers || []).map(h => ({
                ...h,
                value: replaceEnvVariables(h.value, currentEnv)
            })),
            body: replaceEnvVariables(activeRequest.body, currentEnv)
        };
        const curl = buildCurl(processedRequest);
        navigator.clipboard.writeText(curl);
        setCurlCopied(true);
        setTimeout(() => setCurlCopied(false), 2000);
    };

    const getProcessedCurl = () => {
        if (!activeRequest) return '';
        const currentEnv = environments?.find(e => e.id === activeEnv);
        const processedRequest = {
            ...activeRequest,
            url: replaceEnvVariables(activeRequest.url, currentEnv),
            headers: (activeRequest.headers || []).map(h => ({
                ...h,
                value: replaceEnvVariables(h.value, currentEnv)
            })),
            body: replaceEnvVariables(activeRequest.body, currentEnv)
        };
        return buildCurl(processedRequest);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-500">
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
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                <div className="text-6xl mb-4 opacity-50">🚀</div>
                <p>Send a request to see the response here</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 text-xs font-mono mb-3 pb-3 border-b border-slate-200 dark:border-[var(--border-color)]">
                <div className="flex gap-4">
                    <span className={cn(
                        "font-semibold",
                        response.status >= 200 && response.status < 300 ? "text-green-500" : "text-red-500"
                    )}>
                        {response.status} {response.statusText}
                    </span>
                    <span className="text-slate-400">⏱ {response.time}ms</span>
                    <span className="text-slate-400">📦 {response.size}B</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Copy response"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
                                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto bg-white dark:bg-transparent relative">
                        {viewMode === 'pretty' ? (
                            <div className="p-4 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-300">
                                <JsonTree data={typeof response.data === 'string' ? (() => {
                                    try {
                                        if (language === 'xml') {
                                            const parser = new DOMParser();
                                            const xmlDoc = parser.parseFromString(response.data, "text/xml");
                                            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                                                throw new Error("Invalid XML");
                                            }
                                            const parseNode = (node) => {
                                                if (node.nodeType === 3) return node.nodeValue.trim();
                                                const obj = {};
                                                if (node.attributes?.length > 0) {
                                                    for (let i = 0; i < node.attributes.length; i++) {
                                                        const attr = node.attributes[i];
                                                        obj[`@${attr.name}`] = attr.value;
                                                    }
                                                }
                                                if (node.childNodes?.length > 0) {
                                                    let hasElements = false;
                                                    for (let i = 0; i < node.childNodes.length; i++) {
                                                        const child = node.childNodes[i];
                                                        if (child.nodeType === 1) {
                                                            hasElements = true;
                                                            const name = child.nodeName;
                                                            const value = parseNode(child);
                                                            if (obj[name]) {
                                                                if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
                                                                obj[name].push(value);
                                                            } else {
                                                                obj[name] = value;
                                                            }
                                                        } else if (child.nodeType === 3 && child.nodeValue.trim()) {
                                                            if (!hasElements) return child.nodeValue.trim();
                                                            obj["#text"] = child.nodeValue.trim();
                                                        }
                                                    }
                                                }
                                                return Object.keys(obj).length === 0 ? "" : obj;
                                            };
                                            return { [xmlDoc.documentElement.nodeName]: parseNode(xmlDoc.documentElement) };
                                        }
                                        return JSON.parse(response.data);
                                    } catch { return response.data; }
                                })() : response.data} />
                            </div>
                        ) : (
                            <textarea
                                readOnly
                                value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                                className="w-full h-full resize-none p-4 font-mono text-xs bg-white dark:bg-transparent text-slate-900 dark:text-slate-300 outline-none"
                            />
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'headers' && (
                <div className="flex-1 overflow-auto">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        {Object.entries(response.headers || {}).map(([key, value]) => (
                            <div key={key} className="flex border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                <div className="flex-1 p-3 font-mono text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                    {key}
                                </div>
                                <div className="flex-1 p-3 font-mono text-xs text-slate-800 dark:text-slate-300">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                        >
                            {curlCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {curlCopied ? 'Copied' : 'Copy Curl'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <SyntaxHighlighter
                            language="bash"
                            style={atomOneDark}
                            customStyle={{ margin: 0, background: 'var(--bg-surface)', fontSize: '12px', minHeight: '100%' }}
                            showLineNumbers
                            wrapLongLines={true}
                        >
                            {getProcessedCurl()}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}
        </div>
    );
}
