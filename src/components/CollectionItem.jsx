import { ChevronDown, ChevronRight, Folder, FileText, Check, X, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function CollectionItem({
    collection,
    activeCollectionId,
    expandedFolders,
    toggleFolder,
    onLoadRequest,
    editingCollection,
    editName,
    setEditName,
    saveRename,
    cancelRename,
    startRename,
    deleteCollection,
    deleteRequest,
    readOnly = false
}) {
    return (
        <div>
            <div className={cn(
                "flex items-center gap-1 p-1 rounded group transition-colors",
                activeCollectionId === collection.id
                    ? "bg-red-900/30 text-red-500"
                    : "hover:bg-slate-200 dark:hover:bg-white/5"
            )}>
                <button
                    onClick={() => toggleFolder(collection.id)}
                    className="p-0.5"
                >
                    {expandedFolders.has(collection.id) ? (
                        <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    ) : (
                        <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />
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
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-xs text-slate-900 dark:text-slate-300 outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <button
                            onClick={() => saveRename(collection.id)}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-green-500"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                        <button
                            onClick={cancelRename}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-red-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <>
                        <span className={cn(
                            "flex-1 text-xs",
                            activeCollectionId === collection.id
                                ? "text-red-400 font-semibold"
                                : "text-slate-700 dark:text-slate-300"
                        )}>{collection.name}</span>
                        {!readOnly && (
                            <>
                                <button
                                    onClick={() => startRename(collection)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => deleteCollection(collection.id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-500"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </>
                )}


            </div>

            {
                expandedFolders.has(collection.id) && (
                    <div className="ml-4 space-y-0.5">
                        {collection.requests.map(request => (
                            <div
                                key={request.id}
                                className="flex items-center gap-2 p-1 hover:bg-slate-200 dark:hover:bg-white/5 rounded group cursor-pointer"
                                onClick={() => onLoadRequest(request)}
                            >
                                <FileText className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                <span className={cn(
                                    "text-[10px] font-bold uppercase w-12",
                                    request.method === 'GET' && "text-green-500",
                                    request.method === 'POST' && "text-yellow-500",
                                    request.method === 'PUT' && "text-blue-500",
                                    request.method === 'DELETE' && "text-red-500"
                                )}>
                                    {request.method}
                                </span>
                                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400 truncate">{request.name}</span>
                                {!readOnly && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteRequest(collection.id, request.id);
                                        }}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            }
        </div>
    );
}
