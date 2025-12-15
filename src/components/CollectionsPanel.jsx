import { useState, useEffect } from 'react';
import { FolderPlus, FilePlus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit2, Check, X, GripVertical, Save, RefreshCw } from 'lucide-react';
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
    activeProject,
    onProjectSelect,
    onRefreshProject,
    modules,
    activeModule,
    onModuleSelect,
    onRefreshModule,

    activeCollectionId,
    onImportCurl
}) {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [editingCollection, setEditingCollection] = useState(null);
    const [editName, setEditName] = useState('');
    const [isResizing, setIsResizing] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, collectionId: null });

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
        <div className="h-full flex bg-slate-50 dark:bg-[var(--bg-secondary)] border-r border-slate-200 dark:border-[var(--border-color)] relative" style={{ width: `${width}px` }}>
            <div className="flex-1 flex flex-col overflow-hidden">
                {projects && projects.length > 0 && projects[0].id !== 'default' && (
                    <div className="p-2 border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-100 dark:bg-[var(--bg-secondary)] space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 w-16 text-right">App Code:</span>
                            <select
                                value={activeProject}
                                onChange={(e) => onProjectSelect(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                            >
                                {projects.map((proj) => (
                                    <option key={proj.id} value={proj.id}>
                                        {proj.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onRefreshProject}
                                className="p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                title="Refresh Project"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {modules && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 w-16 text-right">Module:</span>
                                <select
                                    value={activeModule}
                                    onChange={(e) => onModuleSelect(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                >
                                    {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={onRefreshModule}
                                    className="p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                                    title="Refresh Module"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={onImportCurl}
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                Import cURL
                            </button>
                        </div>
                    </div>
                )}


                <div className="flex-1 overflow-auto p-2">
                    {/* Server Collections Section */}
                    {serverCollections && serverCollections.length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                    <div className="mb-4">
                        <div className="flex items-center justify-between px-2 py-1.5">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Local Collections
                            </div>
                            <button
                                onClick={addCollection}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                title="New Collection"
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {localCollections && localCollections.length > 0 ? (
                                localCollections.map(collection => (
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
                                ))
                            ) : (
                                <div className="px-2 py-4 text-center text-slate-400 dark:text-slate-600 text-xs italic">
                                    No local collections
                                </div>
                            )}
                        </div>
                    </div>
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
