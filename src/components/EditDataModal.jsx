import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronDown, Plus, Trash2, X, Edit2 } from 'lucide-react';

export function EditDataPanel() {
    const { user } = useAuth();
    const [assignedAppCodes, setAssignedAppCodes] = useState([]);
    const [selectedAppCodeId, setSelectedAppCodeId] = useState('');
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCollections, setExpandedCollections] = useState(new Set());

    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    const [editingRequest, setEditingRequest] = useState(null);
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);
    const [creatingForCollection, setCreatingForCollection] = useState(null);

    const [renamingCollectionId, setRenamingCollectionId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

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
    };

    const handleDeleteRequest = (collectionId, requestId) => {
        if (window.confirm("Are you sure you want to delete this request?")) {
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
        setRenamingCollectionId(null);
        setRenameValue('');
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-white dark:bg-neutral-900">
            <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Edit Data</h2>
                    <label className="block text-xs font-semibold mb-2 text-neutral-600 dark:text-neutral-400">App Code</label>
                    <select
                        value={selectedAppCodeId}
                        onChange={(e) => setSelectedAppCodeId(e.target.value)}
                        className="w-full p-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none focus:border-red-500 dark:text-white"
                    >
                        <option value="">Select App Code...</option>
                        {assignedAppCodes.map(ac => (
                            <option key={ac.projectId || ac.id} value={ac.projectId || ac.id}>
                                {ac.projectName} - {ac.moduleName}
                            </option>
                        ))}
                    </select>

                    {selectedAppCodeId && (
                        <button
                            onClick={() => setIsCreatingCollection(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> New Collection
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {!selectedAppCodeId ? (
                        <div className="p-4 text-center text-xs text-neutral-400">
                            Select an App Code to view collections
                        </div>
                    ) : isLoading ? (
                        <div className="p-4 text-center text-xs text-neutral-400">Loading...</div>
                    ) : collections.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-400">No collections found</div>
                    ) : (
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {collections.map(col => (
                                <div key={col.collectionId} className="bg-white dark:bg-neutral-900">
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 group"
                                        onClick={() => !renamingCollectionId && toggleCollection(col.collectionId)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                            {expandedCollections.has(col.collectionId) ?
                                                <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" /> :
                                                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                                            }
                                            {renamingCollectionId === col.collectionId ? (
                                                <RenameInput
                                                    value={renameValue}
                                                    onChange={setRenameValue}
                                                    onConfirm={handleConfirmRename}
                                                />
                                            ) : (
                                                <span className="text-sm font-medium truncate text-neutral-700 dark:text-neutral-300">{col.name}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">
                                                {col.requests?.length || 0}
                                            </span>
                                            {renamingCollectionId !== col.collectionId && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStartRename(col.collectionId, col.name); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-opacity"
                                                        title="Rename Collection"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCreateNewRequest(col.collectionId); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                                                        title="Add Request"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {expandedCollections.has(col.collectionId) && (
                                        <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-2 border-l-4 border-red-500">
                                            {(!col.requests || col.requests.length === 0) ? (
                                                <div className="text-xs text-neutral-400 italic py-2">No requests</div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {col.requests.map(req => (
                                                        <div
                                                            key={req.requestId}
                                                            className={`group flex items-center justify-between p-2 rounded border cursor-pointer ${editingRequest?.requestId === req.requestId
                                                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                                    : 'hover:bg-white dark:hover:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
                                                                }`}
                                                            onClick={() => { setEditingRequest({ ...req, collectionId: col.collectionId }); setIsCreatingRequest(false); }}
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                                <span className={`text-[10px] font-bold w-12 shrink-0 ${req.method === 'GET' ? 'text-green-500' :
                                                                        req.method === 'POST' ? 'text-yellow-500' :
                                                                            req.method === 'PUT' ? 'text-blue-500' :
                                                                                req.method === 'DELETE' ? 'text-red-500' : 'text-purple-500'
                                                                    }`}>{req.method}</span>
                                                                <span className="text-xs truncate text-neutral-600 dark:text-neutral-400">{req.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteRequest(col.collectionId, req.requestId); }}
                                                                    className="p-1 text-neutral-400 hover:text-red-500 rounded"
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

            {editingRequest ? (
                <RequestEditorPanel
                    request={editingRequest}
                    isCreating={isCreatingRequest}
                    onClose={() => { setEditingRequest(null); setIsCreatingRequest(false); setCreatingForCollection(null); }}
                    onSave={handleSaveRequest}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-600 bg-white dark:bg-neutral-900">
                    <div className="text-center">
                        <p className="text-sm mb-2">Select a request to edit or click + to create a new one</p>
                        <p className="text-xs text-neutral-500">Choose an app code from the sidebar to get started</p>
                    </div>
                </div>
            )}

            {isCreatingCollection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-96 p-6 border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">New Collection</h3>
                        <form onSubmit={handleCreateCollection}>
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                                placeholder="Collection Name"
                                className="w-full text-sm p-3 border rounded mb-4 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreatingCollection(false)} className="px-4 py-2 text-sm text-neutral-500 hover:underline">Cancel</button>
                                <button type="submit" className="px-6 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
            className="flex-1 px-2 py-1 text-sm border border-red-500 rounded bg-white dark:bg-neutral-800 dark:text-white outline-none"
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
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                    {isCreating ? 'New Request' : 'Edit Request'}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> {isCreating ? 'Create' : 'Save'}
                    </button>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Request Name</label>
                    <input
                        type="text"
                        value={editedReq.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-red-500 outline-none"
                        placeholder="My Request"
                    />
                </div>

                <div className="flex gap-3">
                    <div className="w-32">
                        <label className="block text-xs font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Method</label>
                        <select
                            value={editedReq.method}
                            onChange={e => handleChange('method', e.target.value)}
                            className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 dark:text-white font-bold focus:border-red-500 outline-none"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Endpoint URL</label>
                        <input
                            type="text"
                            value={editedReq.url}
                            onChange={e => handleChange('url', e.target.value)}
                            className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 dark:text-white font-mono focus:border-red-500 outline-none"
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Headers</label>
                        <button
                            onClick={handleAddHeader}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Header
                        </button>
                    </div>
                    <div className="space-y-2 border border-neutral-300 dark:border-neutral-700 rounded p-3 bg-neutral-50 dark:bg-neutral-800/50">
                        {headers.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic text-center py-2">No headers. Click "Add Header" to add one.</p>
                        ) : (
                            headers.map(header => (
                                <div key={header.id} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={e => handleHeaderChange(header.id, 'key', e.target.value)}
                                        placeholder="Key"
                                        className="flex-1 p-2 border border-neutral-300 dark:border-neutral-700 rounded text-xs bg-white dark:bg-neutral-800 dark:text-white focus:border-red-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={e => handleHeaderChange(header.id, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 p-2 border border-neutral-300 dark:border-neutral-700 rounded text-xs bg-white dark:bg-neutral-800 dark:text-white focus:border-red-500 outline-none"
                                    />
                                    <button
                                        onClick={() => handleDeleteHeader(header.id)}
                                        className="p-2 text-neutral-400 hover:text-red-500 rounded"
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
                    <label className="block text-xs font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Request Body</label>
                    <textarea
                        value={editedReq.body || ''}
                        onChange={e => handleChange('body', e.target.value)}
                        className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded text-sm font-mono h-40 bg-white dark:bg-neutral-800 dark:text-white resize-none focus:border-red-500 outline-none"
                        placeholder="{}"
                    />
                </div>
            </div>
        </div>
    );
}
