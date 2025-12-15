import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronDown, Plus, Trash2, X, Edit2, MoreVertical, GripVertical } from 'lucide-react';

import { ConfirmationModal } from './ConfirmationModal';

export function EditDataPanel() {
    const { user } = useAuth();
    const [assignedAppCodes, setAssignedAppCodes] = useState([]);
    const [selectedAppCodeId, setSelectedAppCodeId] = useState('');
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCollections, setExpandedCollections] = useState(new Set());

    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // Sidebar Resizing
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    // Menu State
    const [activeMenuCollectionId, setActiveMenuCollectionId] = useState(null);

    const [editingRequest, setEditingRequest] = useState(null);
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);
    const [creatingForCollection, setCreatingForCollection] = useState(null);

    const [renamingCollectionId, setRenamingCollectionId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // Delete Confirmation State
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({
        isOpen: false,
        type: null, // 'collection' or 'request'
        collectionId: null,
        requestId: null
    });

    useEffect(() => {
        if (user && user.assignedAppCodes) {
            setAssignedAppCodes(user.assignedAppCodes);
        }
    }, [user]);

    useEffect(() => {
        if (selectedAppCodeId) {
            setIsLoading(true);
            const appCode = assignedAppCodes.find(ac => (ac.projectId || ac.id) == selectedAppCodeId);
            if (appCode) {
                apiService.getCollectionsByProjectId(appCode.projectId || appCode.id)
                    .then(data => {
                        setCollections(data || []);
                        setIsLoading(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setCollections([]);
                        setIsLoading(false);
                    });
            }
        } else {
            setCollections([]);
        }
    }, [selectedAppCodeId, assignedAppCodes]);

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX - 48; // Subtract global sidebar width (48px)
            if (newWidth >= 200 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.body.style.userSelect = 'none'; // Prevent text selection
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = '';
            };
        }
    }, [isResizing]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuCollectionId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleCollection = (colId) => {
        const next = new Set(expandedCollections);
        if (next.has(colId)) next.delete(colId);
        else next.add(colId);
        setExpandedCollections(next);
    };

    const handleCreateCollection = (e) => {
        e.preventDefault();
        if (!newCollectionName.trim() || !selectedAppCodeId) return;

        const newCol = {
            collectionId: `new-${Date.now()}`,
            name: newCollectionName,
            requests: []
        };

        setCollections([...collections, newCol]);
        setNewCollectionName('');
        setIsCreatingCollection(false);
        setNewCollectionName('');
        setIsCreatingCollection(false);
    };

    const confirmDeleteCollection = (collectionId) => {
        setDeleteConfirmInfo({
            isOpen: true,
            type: 'collection',
            collectionId
        });
    };

    const confirmDeleteRequest = (collectionId, requestId) => {
        setDeleteConfirmInfo({
            isOpen: true,
            type: 'request',
            collectionId,
            requestId
        });
    };

    const handleConfirmDelete = () => {
        const { type, collectionId, requestId } = deleteConfirmInfo;

        if (type === 'collection') {
            setCollections(collections.filter(col => col.collectionId !== collectionId));
        } else if (type === 'request') {
            setCollections(collections.map(col => {
                if (col.collectionId === collectionId) {
                    return {
                        ...col,
                        requests: col.requests.filter(r => r.requestId !== requestId)
                    };
                }
                return col;
            }));
            if (editingRequest && editingRequest.requestId === requestId) {
                setEditingRequest(null);
            }
        }
        setDeleteConfirmInfo({ isOpen: false, type: null, collectionId: null, requestId: null });
    };



    const handleSaveRequest = (updatedRequest) => {
        if (isCreatingRequest) {
            setCollections(collections.map(col => {
                if (col.collectionId === creatingForCollection) {
                    return {
                        ...col,
                        requests: [...(col.requests || []), updatedRequest]
                    };
                }
                return col;
            }));
            setIsCreatingRequest(false);
            setCreatingForCollection(null);
        } else {
            setCollections(collections.map(col => {
                const reqIndex = col.requests ? col.requests.findIndex(r => r.requestId === updatedRequest.requestId) : -1;
                if (reqIndex !== -1) {
                    const newRequests = [...col.requests];
                    newRequests[reqIndex] = updatedRequest;
                    return { ...col, requests: newRequests };
                }
                return col;
            }));
        }
        setEditingRequest(null);
    };

    const handleCreateNewRequest = (collectionId) => {
        const newReq = {
            requestId: `new-req-${Date.now()}`,
            name: 'New Request',
            method: 'GET',
            url: 'https://api.example.com/endpoint',
            headers: { "Content-Type": "application/json" },
            body: null,
            collectionId: collectionId
        };
        setEditingRequest(newReq);
        setIsCreatingRequest(true);
        setCreatingForCollection(collectionId);
    };

    const handleStartRename = (collectionId, currentName) => {
        setRenamingCollectionId(collectionId);
        setRenameValue(currentName);
    };

    const handleConfirmRename = () => {
        if (renameValue.trim() && renamingCollectionId) {
            setCollections(collections.map(col =>
                col.collectionId === renamingCollectionId
                    ? { ...col, name: renameValue.trim() }
                    : col
            ));
        }
        setRenameValue('');
    };

    const handleImport = (type, data) => {
        if (!selectedAppCodeId) return;

        try {
            if (type === 'collection') {
                const parsed = JSON.parse(data);
                // Handle Postman Format v2.1 or generic
                let newCol = {
                    collectionId: `import-col-${Date.now()}`,
                    name: parsed.info?.name || parsed.name || 'Imported Collection',
                    requests: []
                };

                const extractRequests = (items) => {
                    let reqs = [];
                    items.forEach(item => {
                        if (item.item) {
                            // Folder
                            reqs = [...reqs, ...extractRequests(item.item)];
                        } else if (item.request) {
                            // Request
                            reqs.push({
                                requestId: `req-${Date.now()}-${Math.random()}`,
                                name: item.name,
                                method: item.request.method || 'GET',
                                url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
                                headers: item.request.header ? item.request.header.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}) : {},
                                body: item.request.body?.raw || null,
                                collectionId: newCol.collectionId
                            });
                        }
                    });
                    return reqs;
                };

                if (parsed.item) {
                    newCol.requests = extractRequests(parsed.item);
                }

                setCollections(prev => [...prev, newCol]);
            } else if (type === 'curl') {
                // Very basic curl parsing
                const methodMatch = data.match(/-X\s+([A-Z]+)/);
                const urlMatch = data.match(/['"](http.*?)['"]/);
                const headerMatches = [...data.matchAll(/-H\s+['"](.*?)['"]/g)];
                const dataMatch = data.match(/--data\s+['"](.*?)['"]/);

                const newReq = {
                    requestId: `curl-${Date.now()}`,
                    name: 'Imported cURL',
                    method: methodMatch ? methodMatch[1] : 'GET',
                    url: urlMatch ? urlMatch[1] : '',
                    headers: headerMatches.reduce((acc, match) => {
                        const [key, val] = match[1].split(':').map(s => s.trim());
                        if (key && val) acc[key] = val;
                        return acc;
                    }, {}),
                    body: dataMatch ? dataMatch[1] : null,
                };

                // Add to a "cURL Imports" collection
                let existingCurlCol = collections.find(c => c.name === 'cURL Imports');
                if (existingCurlCol) {
                    setCollections(collections.map(c => c.collectionId === existingCurlCol.collectionId ? { ...c, requests: [...c.requests, { ...newReq, collectionId: c.collectionId }] } : c));
                } else {
                    const newCurlCol = {
                        collectionId: `curl-col-${Date.now()}`,
                        name: 'cURL Imports',
                        requests: [{ ...newReq, collectionId: `curl-col-${Date.now()}` }]
                    };
                    setCollections([...collections, newCurlCol]);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Failed to import: ' + e.message);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900 relative">
            <div
                className="border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 relative"
                style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">My App Codes</h2>
                    <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">App Code</label>
                    <select
                        value={selectedAppCodeId}
                        onChange={(e) => setSelectedAppCodeId(e.target.value)}
                        className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:border-red-500 dark:text-white"
                    >
                        <option value="">Select App Code...</option>
                        {assignedAppCodes.map(ac => (
                            <option key={ac.projectId || ac.id} value={ac.projectId || ac.id}>
                                {ac.projectName} - {ac.moduleName}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="flex-1 overflow-y-auto">
                    {!selectedAppCodeId ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                            Select an App Code to view collections
                        </div>
                    ) : isLoading ? (
                        <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
                    ) : collections.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No collections found</div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {collections.map(col => (
                                <div key={col.collectionId} className="bg-white dark:bg-slate-900">
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group"
                                        onClick={() => !renamingCollectionId && toggleCollection(col.collectionId)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                            {expandedCollections.has(col.collectionId) ?
                                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> :
                                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                            }
                                            {renamingCollectionId === col.collectionId ? (
                                                <RenameInput
                                                    value={renameValue}
                                                    onChange={setRenameValue}
                                                    onConfirm={handleConfirmRename}
                                                />
                                            ) : (
                                                <span className="text-sm font-medium truncate text-slate-700 dark:text-slate-300">{col.name}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                                {col.requests?.length || 0}
                                            </span>
                                            {renamingCollectionId !== col.collectionId && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuCollectionId(activeMenuCollectionId === col.collectionId ? null : col.collectionId);
                                                        }}
                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {activeMenuCollectionId === col.collectionId && (
                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStartRename(col.collectionId, col.name); setActiveMenuCollectionId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <Edit2 className="w-3 h-3" /> Rename
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleCreateNewRequest(col.collectionId); setActiveMenuCollectionId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add Request
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); confirmDeleteCollection(col.collectionId); setActiveMenuCollectionId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="w-3 h-3" /> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {expandedCollections.has(col.collectionId) && (
                                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-l-4 border-red-500">
                                            {(!col.requests || col.requests.length === 0) ? (
                                                <div className="text-xs text-slate-400 italic py-2">No requests</div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {col.requests.map(req => (
                                                        <div
                                                            key={req.requestId}
                                                            className={`group flex items-center justify-between p-2 rounded border cursor-pointer ${editingRequest?.requestId === req.requestId
                                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                                : 'hover:bg-white dark:hover:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                                }`}
                                                            onClick={() => { setEditingRequest({ ...req, collectionId: col.collectionId }); setIsCreatingRequest(false); }}
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                                <span className={`text-[10px] font-bold w-12 shrink-0 ${req.method === 'GET' ? 'text-green-500' :
                                                                    req.method === 'POST' ? 'text-yellow-500' :
                                                                        req.method === 'PUT' ? 'text-blue-500' :
                                                                            req.method === 'DELETE' ? 'text-red-500' : 'text-purple-500'
                                                                    }`}>{req.method}</span>
                                                                <span className="text-xs truncate text-slate-600 dark:text-slate-400">{req.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); confirmDeleteRequest(col.collectionId, req.requestId); }}
                                                                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize transition-all flex items-center justify-center group z-10"
                onMouseDown={(e) => { setIsResizing(true); e.preventDefault(); }}
            >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3 text-blue-500" />
                </div>
            </div>
            {/* Right Pane Container */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden relative">
                {/* Right Pane Header */}
                {selectedAppCodeId && (
                    <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6 bg-white dark:bg-slate-900 shrink-0">
                        <div className="font-bold text-slate-700 dark:text-slate-200">
                            {assignedAppCodes.find(ac => (ac.projectId || ac.id) == selectedAppCodeId)?.projectName}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsImporting(true)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Import
                            </button>
                            <button
                                onClick={() => setIsCreatingCollection(true)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-3 h-3" /> New Collection
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden relative">
                    {editingRequest ? (
                        <RequestEditorPanel
                            request={editingRequest}
                            isCreating={isCreatingRequest}
                            onClose={() => { setEditingRequest(null); setIsCreatingRequest(false); setCreatingForCollection(null); }}
                            onSave={handleSaveRequest}
                        />
                    ) : (
                        <div className="flex-1 h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900">
                            <div className="text-center">
                                <p className="text-sm mb-2">Select a request to edit or click + to create a new one</p>
                                <p className="text-xs text-slate-500">Choose an app code from the sidebar to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isCreatingCollection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-96 p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">New Collection</h3>
                        <form onSubmit={handleCreateCollection}>
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                                placeholder="Collection Name"
                                className="w-full text-sm p-3 border rounded mb-4 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreatingCollection(false)} className="px-4 py-2 text-sm text-slate-500 hover:underline">Cancel</button>
                                <button type="submit" className="px-6 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isImporting && (
                <ImportModal
                    isOpen={isImporting}
                    onClose={() => setIsImporting(false)}
                    onImport={handleImport}
                />
            )}

            <ConfirmationModal
                isOpen={deleteConfirmInfo.isOpen}
                onClose={() => setDeleteConfirmInfo({ ...deleteConfirmInfo, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteConfirmInfo.type === 'collection' ? "Delete Collection" : "Delete Request"}
                message={`Are you sure you want to delete this ${deleteConfirmInfo.type}? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}

function ImportModal({ isOpen, onClose, onImport }) {
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

function RenameInput({ value, onChange, onConfirm }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                onConfirm();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onConfirm]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onConfirm();
        } else if (e.key === 'Escape') {
            onConfirm();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-1 text-sm border border-red-500 rounded bg-white dark:bg-slate-800 dark:text-white outline-none"
        />
    );
}

function RequestEditorPanel({ request, isCreating, onClose, onSave }) {
    const [editedReq, setEditedReq] = useState({ ...request });
    const [headers, setHeaders] = useState(() => {
        const h = typeof request.headers === 'object' ? request.headers : {};
        return Object.entries(h).map(([key, value]) => ({ key, value, id: Math.random() }));
    });

    const handleChange = (field, value) => {
        setEditedReq(prev => ({ ...prev, [field]: value }));
    };

    const handleAddHeader = () => {
        setHeaders([...headers, { key: '', value: '', id: Math.random() }]);
    };

    const handleHeaderChange = (id, field, value) => {
        setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const handleDeleteHeader = (id) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    const handleSave = () => {
        const headersObj = headers.reduce((acc, h) => {
            if (h.key.trim()) {
                acc[h.key.trim()] = h.value;
            }
            return acc;
        }, {});

        onSave({ ...editedReq, headers: headersObj });
    };

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {isCreating ? 'New Request' : 'Edit Request'}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium flex items-center gap-2"
                    >
                        {isCreating ? 'Create' : 'Save'}
                    </button>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Request Name</label>
                    <input
                        type="text"
                        value={editedReq.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-white focus:border-red-500 outline-none"
                        placeholder="My Request"
                    />
                </div>

                <div className="flex gap-3">
                    <div className="w-32">
                        <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Method</label>
                        <select
                            value={editedReq.method}
                            onChange={e => handleChange('method', e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-white font-bold focus:border-red-500 outline-none"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Endpoint URL</label>
                        <input
                            type="text"
                            value={editedReq.url}
                            onChange={e => handleChange('url', e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-white font-mono focus:border-red-500 outline-none"
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Headers</label>
                        <button
                            onClick={handleAddHeader}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Header
                        </button>
                    </div>
                    <div className="space-y-2 border border-slate-300 dark:border-slate-700 rounded p-3 bg-slate-50 dark:bg-slate-800/50">
                        {headers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-2">No headers. Click "Add Header" to add one.</p>
                        ) : (
                            headers.map(header => (
                                <div key={header.id} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={e => handleHeaderChange(header.id, 'key', e.target.value)}
                                        placeholder="Key"
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 dark:text-white focus:border-red-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={e => handleHeaderChange(header.id, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 dark:text-white focus:border-red-500 outline-none"
                                    />
                                    <button
                                        onClick={() => handleDeleteHeader(header.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded"
                                        title="Delete Header"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Request Body</label>
                    <textarea
                        value={editedReq.body || ''}
                        onChange={e => handleChange('body', e.target.value)}
                        className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded text-sm font-mono h-40 bg-white dark:bg-slate-800 dark:text-white resize-none focus:border-red-500 outline-none"
                        placeholder="{}"
                    />
                </div>
            </div>
        </div>
    );
}
