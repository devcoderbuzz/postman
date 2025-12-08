import { useState, useEffect } from 'react';
import { FolderPlus, FilePlus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit2, Check, X, GripVertical, Save, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export function CollectionsPanel({
    collections,
    setCollections,
    onLoadRequest,
    width,
    onWidthChange,
    onSaveCollection,
    onReloadCollection,
    projects,
    activeProject,
    onProjectSelect,
    onRefreshProject,
    modules,
    activeModule,
    onModuleSelect,
    onRefreshModule
}) {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [editingCollection, setEditingCollection] = useState(null);
    const [editName, setEditName] = useState('');
    const [isResizing, setIsResizing] = useState(false);

    const addCollection = () => {
        const newCollection = {
            id: Date.now().toString(),
            name: 'New Collection',
            requests: []
        };
        setCollections([...collections, newCollection]);
    };

    const deleteCollection = (id) => {
        if (window.confirm('Are you sure you want to delete this collection?')) {
            setCollections(collections.filter(col => col.id !== id));
        }
    };

    const deleteRequest = (collectionId, requestId) => {
        setCollections(collections.map(col => {
            if (col.id === collectionId) {
                return { ...col, requests: col.requests.filter(req => req.id !== requestId) };
            }
            return col;
        }));
    };

    const toggleFolder = (id) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedFolders(newExpanded);
    };

    const startRename = (collection) => {
        setEditingCollection(collection.id);
        setEditName(collection.name);
    };

    const saveRename = (collectionId) => {
        if (editName.trim()) {
            setCollections(collections.map(col =>
                col.id === collectionId ? { ...col, name: editName.trim() } : col
            ));
        }
        setEditingCollection(null);
        setEditName('');
    };

    const cancelRename = () => {
        setEditingCollection(null);
        setEditName('');
    };

    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    // Add event listeners for resize
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX - 64; // 64px is sidebar width
            if (newWidth >= 200 && newWidth <= 600) {
                onWidthChange(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, onWidthChange]);

    return (
        <div className="h-full flex bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 relative" style={{ width: `${width}px` }}>
            <div className="flex-1 flex flex-col overflow-hidden">
                {projects && (
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-neutral-500 w-16 text-right">App Code:</span>
                            <select
                                value={activeProject}
                                onChange={(e) => onProjectSelect(e.target.value)}
                                className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                            >
                                {projects.map((proj) => (
                                    <option key={proj.id} value={proj.id}>
                                        {proj.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onRefreshProject}
                                className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-500 hover:text-blue-500 transition-colors"
                                title="Refresh Project"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {modules && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-neutral-500 w-16 text-right">Module:</span>
                                <select
                                    value={activeModule}
                                    onChange={(e) => onModuleSelect(e.target.value)}
                                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                                >
                                    {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={onRefreshModule}
                                    className="p-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-500 hover:text-blue-500 transition-colors"
                                    title="Refresh Module"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Collections</h2>
                        <button
                            onClick={addCollection}
                            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            title="New Collection"
                        >
                            <FolderPlus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-2">
                    {collections.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 dark:text-neutral-600 text-xs">
                            No collections yet
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {collections.map(collection => (
                                <div key={collection.id}>
                                    <div className="flex items-center gap-1 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded group">
                                        <button
                                            onClick={() => toggleFolder(collection.id)}
                                            className="p-0.5"
                                        >
                                            {expandedFolders.has(collection.id) ? (
                                                <ChevronDown className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                            )}
                                        </button>
                                        <Folder className="w-4 h-4 text-yellow-600" />

                                        {editingCollection === collection.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveRename(collection.id);
                                                        if (e.key === 'Escape') cancelRename();
                                                    }}
                                                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 text-xs text-neutral-900 dark:text-neutral-300 outline-none focus:border-blue-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveRename(collection.id)}
                                                    className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-green-500"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={cancelRename}
                                                    className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-xs text-neutral-700 dark:text-neutral-300">{collection.name}</span>
                                                <button
                                                    onClick={() => startRename(collection)}
                                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-blue-400"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => deleteCollection(collection.id)}
                                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}

                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSaveCollection(collection);
                                                }}
                                                className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-blue-500"
                                                title="Save to DB"
                                            >
                                                <Save className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onReloadCollection(collection.id);
                                                }}
                                                className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-green-500"
                                                title="Reload from DB"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {
                                        expandedFolders.has(collection.id) && (
                                            <div className="ml-4 space-y-0.5">
                                                {collection.requests.map(request => (
                                                    <div
                                                        key={request.id}
                                                        className="flex items-center gap-2 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded group cursor-pointer"
                                                        onClick={() => onLoadRequest(request)}
                                                    >
                                                        <FileText className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase w-12",
                                                            request.method === 'GET' && "text-green-500",
                                                            request.method === 'POST' && "text-yellow-500",
                                                            request.method === 'PUT' && "text-blue-500",
                                                            request.method === 'DELETE' && "text-red-500"
                                                        )}>
                                                            {request.method}
                                                        </span>
                                                        <span className="flex-1 text-xs text-neutral-600 dark:text-neutral-400 truncate">{request.name}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteRequest(collection.id, request.id);
                                                            }}
                                                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize transition-all flex items-center justify-center group"
                onMouseDown={handleMouseDown}
            >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3 text-blue-500" />
                </div>
            </div>
        </div >
    );
}
