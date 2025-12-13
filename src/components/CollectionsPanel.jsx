import { useState, useEffect } from 'react';
import { FolderPlus, FilePlus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit2, Check, X, GripVertical, Save, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { CollectionItem } from './CollectionItem';

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
    activeProject,
    onProjectSelect,
    onRefreshProject,
    modules,
    activeModule,
    onModuleSelect,
    onRefreshModule,
    activeCollectionId
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
        setLocalCollections([...localCollections, newCollection]);
    };

    const deleteCollection = (id) => {
        if (window.confirm('Are you sure you want to delete this collection?')) {
            setLocalCollections(localCollections.filter(col => col.id !== id));
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
        <div className="h-full flex bg-neutral-50 dark:bg-[var(--bg-secondary)] border-r border-neutral-200 dark:border-[var(--border-color)] relative" style={{ width: `${width}px` }}>
            <div className="flex-1 flex flex-col overflow-hidden">
                {projects && (
                    <div className="p-3 border-b border-neutral-200 dark:border-[var(--border-color)] bg-neutral-100 dark:bg-[var(--bg-secondary)] space-y-2">
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
                <div className="p-3 border-b border-neutral-200 dark:border-[var(--border-color)]">
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
                    {/* Server Collections Section */}
                    {serverCollections && serverCollections.length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                Server Collections
                            </div>
                            <div className="space-y-1">
                                {serverCollections.map(collection => (
                                    <CollectionItem
                                        key={collection.id}
                                        collection={collection}
                                        activeCollectionId={activeCollectionId}
                                        expandedFolders={expandedFolders}
                                        toggleFolder={toggleFolder}
                                        onLoadRequest={onLoadRequest}
                                        readOnly={true} // Server collections usually strictly managed
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Local Collections Section */}
                    {localCollections && localCollections.length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                Local Collections
                            </div>
                            <div className="space-y-1">
                                {localCollections.map(collection => (
                                    <CollectionItem
                                        key={collection.id}
                                        collection={collection}
                                        activeCollectionId={activeCollectionId}
                                        expandedFolders={expandedFolders}
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
                                ))}
                            </div>
                        </div>
                    )}

                    {(!serverCollections?.length && !localCollections?.length) && (
                        <div className="text-center py-8 text-neutral-400 dark:text-neutral-600 text-xs">
                            No collections yet
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
