import React, { useState } from 'react';
import { X } from 'lucide-react';

export function ImportModal({ isOpen, onClose, onImport }) {
    const [importType, setImportType] = useState('collection'); // 'collection' or 'curl'
    const [inputType, setInputType] = useState('text'); // 'text' or 'file'
    const [textInput, setTextInput] = useState('');
    const [fileInput, setFileInput] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileInput(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let dataToImport = null;

        if (inputType === 'text') {
            dataToImport = textInput;
        } else if (inputType === 'file' && fileInput) {
            dataToImport = await fileInput.text();
        }

        if (dataToImport) {
            onImport(importType, dataToImport);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[500px] p-6 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">Import Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'collection'}
                                onChange={() => setImportType('collection')}
                                className="accent-red-600"
                            />
                            <span className="text-sm">Collection (JSON)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'curl'}
                                onChange={() => setImportType('curl')}
                                className="accent-red-600"
                            />
                            <span className="text-sm">cURL</span>
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex gap-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setInputType('text')}
                            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${inputType === 'text' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Paste Text
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputType('file')}
                            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${inputType === 'file' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Upload File
                        </button>
                    </div>

                    {inputType === 'text' ? (
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            className="w-full h-40 p-3 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono bg-slate-50 dark:bg-slate-900 outline-none focus:border-red-500 resize-none"
                            placeholder={importType === 'collection' ? 'Paste Postman Collection JSON here...' : 'Paste cURL command here...'}
                        ></textarea>
                    ) : (
                        <div className="h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                accept={importType === 'collection' ? '.json' : '.txt,.sh'}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400 mb-2">Click to upload file</span>
                                <span className="text-xs text-slate-400">
                                    {fileInput ? fileInput.name : (importType === 'collection' ? 'JSON files only' : 'Text files')}
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:underline">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium">Import</button>
                </div>
            </div>
        </div>
    );
}
