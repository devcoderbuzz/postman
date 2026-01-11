import { useState, useEffect } from 'react';
import { FolderPlus, FilePlus, Plus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit2, Check, X, GripVertical, Save, RefreshCw, Search, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { CollectionItem } from './CollectionItem';
import { ConfirmationModal } from './ConfirmationModal';

export function CollectionsPanel({
    localCollections,
    setLocalCollections,
    serverCollections,
    onLoadRequest,
    width,
    onWidthChange,
    onSaveCollection,
    onReloadCollection,
    projects,
    activeAppCode,
    onAppCodeSelect,
    onRefreshAppCode,
    modules,
    activeModule,
    onModuleSelect,
    onRefreshModule,

    activeCollectionId,
    onImportCurl,
    environments,
    activeEnv,
    onEnvSelect
}) {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [editingCollection, setEditingCollection] = useState(null);
    const [editName, setEditName] = useState('');
    const [isResizing, setIsResizing] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, collectionId: null });
    const [activeCollectionsTab, setActiveCollectionsTab] = useState('server');
    const [searchQuery, setSearchQuery] = useState('');

    const addCollection = () => {
        const newCollection = {
            id: Date.now().toString(),
            name: 'New Collection',
            requests: []
        };
        setLocalCollections([...localCollections, newCollection]);
    };

    const deleteCollection = (id) => {
        setDeleteConfirmation({ isOpen: true, collectionId: id });
    };

    const handleConfirmDelete = () => {
        if (deleteConfirmation.collectionId) {
            setLocalCollections(localCollections.filter(col => col.id !== deleteConfirmation.collectionId));
            setDeleteConfirmation({ isOpen: false, collectionId: null });
        }
    };

    const deleteRequest = (collectionId, requestId) => {
        setLocalCollections(localCollections.map(col => {
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
            setLocalCollections(localCollections.map(col =>
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
            const newWidth = e.clientX - 80; // 80px is the w-20 sidebar width
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
        <div className="h-full flex bg-slate-50 dark:bg-[var(--bg-secondary)] border-r border-slate-200 dark:border-[var(--border-color)] relative" style={{ width: `${width}px` }}>
            <div className="flex-1 flex flex-col overflow-hidden">

                {projects && projects.length > 0 && projects[0].id !== 'default' && (
                    <div className="p-1.5 border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-100 dark:bg-[var(--bg-secondary)] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-slate-500 w-16 text-right whitespace-nowrap">App Code:</span>
                            <select
                                value={activeAppCode}
                                onChange={(e) => onAppCodeSelect(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[14px] outline-none focus:border-blue-500"
                            >
                                {projects.map((proj) => (
                                    <option key={proj.id} value={proj.id}>
                                        {proj.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onRefreshAppCode}
                                className="p-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                title="Refresh App Code"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                        </div>
                        {modules && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-medium text-slate-500 w-16 text-right whitespace-nowrap">Module:</span>
                                <select
                                    value={activeModule}
                                    onChange={(e) => onModuleSelect(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[14px] outline-none focus:border-blue-500"
                                >
                                    {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Always Visible Search Bar */}
                <div className="px-2 py-1.5 border-b border-slate-200 dark:border-[var(--border-color)] bg-white/30 dark:bg-white/5">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded pl-8 pr-8 py-1.5 text-[11px] outline-none focus:border-red-500/50 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>



                {/* Collections View Tabs */}
                <div className="flex border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-100/50 dark:bg-[var(--bg-secondary)]/50">
                    <button
                        onClick={() => setActiveCollectionsTab('server')}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all relative",
                            activeCollectionsTab === 'server'
                                ? "text-red-500 bg-white dark:bg-slate-800"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Server
                        {activeCollectionsTab === 'server' && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveCollectionsTab('local')}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all relative",
                            activeCollectionsTab === 'local'
                                ? "text-red-500 bg-white dark:bg-slate-800"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Local
                        {activeCollectionsTab === 'local' && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500" />
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-1.5 custom-scrollbar">
                    {/* Server Collections Section */}
                    {activeCollectionsTab === 'server' && (
                        <div>
                            {(() => {
                                const filtered = (serverCollections || []).filter(col => {
                                    const searchLower = searchQuery.toLowerCase();
                                    const collectionMatch = col.name.toLowerCase().includes(searchLower);
                                    const requestMatch = col.requests?.some(req =>
                                        req.name.toLowerCase().includes(searchLower) ||
                                        req.method.toLowerCase().includes(searchLower) ||
                                        req.url?.toLowerCase().includes(searchLower)
                                    );
                                    return collectionMatch || requestMatch;
                                });

                                return filtered.length > 0 ? (
                                    <div className="space-y-1">
                                        {filtered.map(collection => (
                                            <CollectionItem
                                                key={collection.id}
                                                collection={{
                                                    ...collection,
                                                    requests: searchQuery ? collection.requests.filter(req =>
                                                        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        req.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        req.url?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    ) : collection.requests
                                                }}
                                                activeCollectionId={activeCollectionId}
                                                expandedFolders={searchQuery ? new Set([...expandedFolders, collection.id]) : expandedFolders}
                                                toggleFolder={toggleFolder}
                                                onLoadRequest={onLoadRequest}
                                                readOnly={true}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-2 py-8 text-center">
                                        <Folder className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                                        <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                                            {searchQuery ? "No matching requests found." : "No server collections found for this module."}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Local Collections Section */}
                    {activeCollectionsTab === 'local' && (
                        <div>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    My Collections
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={addCollection}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        title="New Collection"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={onImportCurl}
                                        className="px-1.5 py-0.5 text-[8px] font-bold text-red-500 dark:text-red-400 border border-red-500/20 dark:border-red-400/20 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors uppercase"
                                    >
                                        Import
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {(() => {
                                    const filtered = (localCollections || []).filter(col => {
                                        const searchLower = searchQuery.toLowerCase();
                                        const collectionMatch = col.name.toLowerCase().includes(searchLower);
                                        const requestMatch = col.requests?.some(req =>
                                            req.name.toLowerCase().includes(searchLower) ||
                                            req.method.toLowerCase().includes(searchLower) ||
                                            req.url?.toLowerCase().includes(searchLower)
                                        );
                                        return collectionMatch || requestMatch;
                                    });

                                    return filtered.length > 0 ? (
                                        filtered.map(collection => (
                                            <CollectionItem
                                                key={collection.id}
                                                collection={{
                                                    ...collection,
                                                    requests: searchQuery ? collection.requests.filter(req =>
                                                        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        req.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        req.url?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    ) : collection.requests
                                                }}
                                                activeCollectionId={activeCollectionId}
                                                expandedFolders={searchQuery ? new Set([...expandedFolders, collection.id]) : expandedFolders}
                                                toggleFolder={toggleFolder}
                                                onLoadRequest={onLoadRequest}
                                                editingCollection={editingCollection}
                                                editName={editName}
                                                setEditName={setEditName}
                                                saveRename={saveRename}
                                                cancelRename={cancelRename}
                                                startRename={startRename}
                                                deleteCollection={deleteCollection}
                                                deleteRequest={deleteRequest}
                                                onSaveCollection={onSaveCollection}
                                                onReloadCollection={onReloadCollection}
                                            />
                                        ))
                                    ) : (
                                        <div className="px-2 py-8 text-center">
                                            <Folder className="w-8 h-8 mx-auto mb-2 text-slate-200 dark:text-slate-700" />
                                            <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                                                {searchQuery ? "No matching local requests found." : "Your local collections will appear here."}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* Resize Handle */}
            <div
                className="w-px hover:w-1 bg-slate-200 dark:bg-[var(--border-color)] hover:bg-red-500 cursor-col-resize transition-all flex items-center justify-center group z-50"
                onMouseDown={handleMouseDown}
            >
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, collectionId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Collection"
                message="Are you sure you want to delete this collection? This action cannot be undone."
                confirmText="Delete"
                isDangerous={true}
            />
        </div >
    );
}
