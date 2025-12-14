import { useState } from 'react';
import { X } from 'lucide-react';

export function ImportCurlModal({ isOpen, onClose, onImport }) {
    const [curlCommand, setCurlCommand] = useState('');
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const parseCurl = (curlCommand) => {
        try {
            // 1. Normalize: Remove backslashes used for line continuation and newlines
            let normalized = curlCommand.replace(/\\\s*/g, ' ').trim();

            // 2. Tokenize: Match quoted strings or non-whitespace sequences
            // Regex explanation:
            // "([^"]*)" -> Double quoted
            // '([^']*)' -> Single quoted
            // [^\s"']+(?:\\.[^\s"']*)* -> Plain words (simplistic) - actually [^\s"']+ is enough for basics
            const regex = /"([^"]*)"|'([^']*)'|[^\s"']+/g;
            const tokens = [];
            let match;

            while ((match = regex.exec(normalized)) !== null) {
                // match[1] is double quoted content
                // match[2] is single quoted content
                // match[0] is the unquoted word if 1 and 2 are undefined
                if (match[1] !== undefined) tokens.push(match[1]);
                else if (match[2] !== undefined) tokens.push(match[2]);
                else tokens.push(match[0]);
            }

            let method = 'GET';
            let url = '';
            const headers = [];
            let body = '';
            let bodyType = 'none';

            // 3. Parse Tokens
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];

                if (token === 'curl') continue;

                if (token.startsWith('http://') || token.startsWith('https://')) {
                    if (!url) url = token;
                    continue;
                }

                // Flags
                if (token === '-X' || token === '--request') {
                    if (tokens[i + 1]) {
                        method = tokens[i + 1].toUpperCase();
                        i++; // consume next
                    }
                } else if (token === '-H' || token === '--header') {
                    if (tokens[i + 1]) {
                        const headerStr = tokens[i + 1];
                        const separatorIndex = headerStr.indexOf(':');
                        if (separatorIndex !== -1) {
                            const key = headerStr.slice(0, separatorIndex).trim();
                            const value = headerStr.slice(separatorIndex + 1).trim();
                            headers.push({ key, value, active: true });

                            if (key.toLowerCase() === 'content-type' && value.toLowerCase().includes('json')) {
                                bodyType = 'json';
                            }
                        }
                        i++;
                    }
                } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
                    if (tokens[i + 1]) {
                        body = tokens[i + 1];
                        if (method === 'GET') method = 'POST'; // Default to POST if data is present
                        if (bodyType === 'none' && (body.startsWith('{') || body.startsWith('['))) {
                            bodyType = 'json';
                        }
                        i++;
                    }
                } else if (token === '--location' || token === '-L') {
                    // Ignore location
                    continue;
                } else if (token === '--compressed') {
                    // Ignore
                    continue;
                }
                // TODO: other flags can be added here
            }

            if (!url) {
                // As a fallback, check if any token *looks* like a URL but didn't start with http (e.g. localhost:8080)
                // Or maybe the user didn't put http. cURL technically defaults to http but let's be strict or loose?
                // Let's stick to requiring http/https or trying to guess.
            }

            if (!url) throw new Error('Could not find URL in cURL command');

            return {
                method,
                url,
                headers,
                body,
                bodyType
            };
        } catch (e) {
            console.error('Parse error:', e);
            throw new Error('Failed to parse cURL. Ensure it is a valid format.');
        }
    };

    const handleImport = () => {
        setError(null);
        if (!curlCommand.trim()) {
            setError('Please enter a cURL command');
            return;
        }

        try {
            const parsed = parseCurl(curlCommand);
            onImport(parsed);
            setCurlCommand('');
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Import cURL</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                        Paste your cURL command below to import it as a new request.
                    </p>
                    <textarea
                        value={curlCommand}
                        onChange={(e) => setCurlCommand(e.target.value)}
                        className="w-full h-64 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-mono text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="curl -X POST https://api.example.com/data ..."
                    />
                    {error && (
                        <div className="mt-2 text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
}
