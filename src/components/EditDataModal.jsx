import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronDown, Plus, Trash2, X, Edit2, MoreVertical, GripVertical, Save, Folder, FileText, Search, Globe } from 'lucide-react';
import { createUpdateCollections, getAllAppCodes, deleteCollection, getCollectionDetails, getEnvDetails } from '../services/apiservice';
import { replaceEnvVariables } from '../lib/utils';
import { VariableAutocomplete } from './VariableAutocomplete';

import { ConfirmationModal } from './ConfirmationModal';
import { ImportModal } from './ImportModal';

export function EditDataPanel({ refreshTrigger }) {
    const { user } = useAuth();
    const [assignedAppCodes, setAssignedAppCodes] = useState([]);
    const [selectedAppCodeId, setSelectedAppCodeId] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCollections, setExpandedCollections] = useState(new Set());
    const [collectionSearchTerm, setCollectionSearchTerm] = useState('');

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
        type: null,
        collectionId: null,
        requestId: null
    });
    const [panelEnvironments, setPanelEnvironments] = useState([]);
    const [selectedEnvId, setSelectedEnvId] = useState('');

    useEffect(() => {
        const fetchCodes = async () => {
            if (user) {
                try {
                    let hierarchyData;
                    if (user.role === 'developer' || user.role === 'dev') {
                        const projectIds = user.projectIds || [];
                        hierarchyData = await getCollectionDetails(projectIds, user.token);
                    } else {
                        hierarchyData = await getAllAppCodes(user.token);
                    }

                    if (!hierarchyData || !Array.isArray(hierarchyData)) {
                        hierarchyData = [];
                    }

                    let filtered = [];
                    const userProjectIds = user.projectIds || [];

                    if (userProjectIds.length > 0) {
                        filtered = hierarchyData.filter(project =>
                            userProjectIds.includes(project.appCode) || userProjectIds.includes(project.projectId)
                        );
                    } else if (user.assignedAppCodes && user.assignedAppCodes.length > 0) {
                        filtered = user.assignedAppCodes;
                    } else {
                        filtered = hierarchyData;
                    }

                    const formatted = filtered.map(p => {
                        const pid = parseInt(p.projectId || p.id);
                        return {
                            ...p,
                            projectName: p.appCode || p.projectName,
                            moduleName: p.moduleName || 'default',
                            projectId: pid
                        };
                    });
                    setAssignedAppCodes(formatted);
                } catch (e) {
                    console.error("Failed to fetch app codes in EditDataPanel", e);
                    if (user.assignedAppCodes) setAssignedAppCodes(user.assignedAppCodes);
                }
            }
        };
        fetchCodes();
    }, [user, refreshTrigger]);

    useEffect(() => {
        if (selectedAppCodeId) {
            const appCode = assignedAppCodes.find(ac => (ac.projectId || ac.id) == selectedAppCodeId);
            if (appCode && appCode.collections && Array.isArray(appCode.collections)) {
                setCollections(appCode.collections.map(c => ({
                    ...c,
                    originalName: c.name,
                    modified: false
                })));
            } else {
                setCollections([]);
            }
        } else {
            setCollections([]);
        }
    }, [selectedAppCodeId, assignedAppCodes]);

    // Fetch environments for the selected project
    useEffect(() => {
        const fetchEnvs = async () => {
            if (selectedAppCodeId && user?.token) {
                try {
                    const data = await getEnvDetails(selectedAppCodeId, user.token);
                    if (data) {
                        let envList = [];
                        if (Array.isArray(data)) {
                            if (data.length > 0 && data[0] && data[0].environments) {
                                envList = data.flatMap(p => (p && p.environments) || []);
                            } else {
                                envList = data;
                            }
                        } else if (data.environments) {
                            envList = data.environments;
                        }

                        const formatted = envList.map(env => ({
                            id: String(env.envID || env.id || env.envName),
                            name: env.envName || env.name,
                            variables: (env.variables || []).map(v => ({
                                key: v.variableKey || v.key || '',
                                value: String(v.variableValue || v.value || ''),
                                active: true
                            }))
                        }));
                        setPanelEnvironments(formatted);
                        if (formatted.length > 0) {
                            const firstEnv = formatted[0].id;
                            setSelectedEnvId(firstEnv);
                        } else {
                            setSelectedEnvId('');
                        }
                    } else {
                        setPanelEnvironments([]);
                        setSelectedEnvId('');
                    }
                } catch (e) {
                    console.error("Failed to fetch environments", e);
                    setPanelEnvironments([]);
                    setSelectedEnvId('');
                }
            } else {
                setPanelEnvironments([]);
                setSelectedEnvId('');
            }
        };
        fetchEnvs();
    }, [selectedAppCodeId, user]);

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
            originalName: newCollectionName,
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
            const isTransient = collectionId.toString().includes('new') || collectionId.toString().includes('import') || collectionId.toString().includes('curl');

            if (!isTransient) {
                // Call API for existing collections
                deleteCollection(collectionId, user?.token)
                    .then(() => {
                        console.log(`Collection ${collectionId} deleted from server.`);
                        // Update UI only after successful server deletion
                        setCollections(prev => prev.filter(col => col.collectionId !== collectionId));
                    })
                    .catch(err => {
                        console.error('Failed to delete collection:', err);
                        alert(`Failed to delete collection from server: ${err.message}`);
                        // Optionally, don't remove from UI so user knows it failed
                    });
            } else {
                // Just remove from local state
                setCollections(collections.filter(col => col.collectionId !== collectionId));
            }
        } else if (type === 'request') {
            setCollections(collections.map(col => {
                if (col.collectionId === collectionId) {
                    return {
                        ...col,
                        requests: col.requests.filter(r => r.requestId !== requestId),
                        modified: true
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
                        requests: [...(col.requests || []), updatedRequest],
                        modified: true
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
                    return { ...col, requests: newRequests, modified: true };
                }
                return col;
            }));
        }
        setEditingRequest(null);
    };

    const handleCreateNewRequest = (collectionId) => {
        const newReq = {
            requestId: `new-req-${Date.now()}`, // Transient marker
            name: 'New Request',
            method: 'GET',
            url: '',
            headers: {},
            body: '',
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

    const handleSaveCollection = async (e, collection) => {
        const appId = selectedAppCodeId || 'NONE';
        console.log(`DEBUG: handleSaveCollection triggered for appId: ${appId}`);

        e.stopPropagation();
        setIsLoading(true);
        try {
            // Helper to check if an ID is one of our temporary strings
            const isTransientId = (id) => {
                if (!id) return true;
                const str = id.toString().toLowerCase();
                return str.includes('new') || str.includes('import') || str.includes('req');
            };

            const isNewCollection = isTransientId(collection.collectionId);

            // Find the selected app code to get its actual projectId
            const currentAppCode = assignedAppCodes.find(ac => (ac.projectId || ac.id) == selectedAppCodeId);
            const actualProjectId = currentAppCode?.projectId || (selectedAppCodeId ? parseInt(selectedAppCodeId) : null);

            if (!actualProjectId || isNaN(actualProjectId)) {
                const msg = `CRITICAL: Cannot save collection. Project ID is invalid.\nSelectedAppCodeId: ${appId}\nFound ProjectId: ${actualProjectId}`;
                console.error(msg, { availableCodes: assignedAppCodes });
                alert(msg + "\n\nPlease ensure a Project and Module are selected.");
                setIsLoading(false);
                return;
            }

            const payload = {
                id: collection.id ? collection.id : (isNewCollection ? null : collection.collectionId),
                collectionId: collection.id ? collection.id : (isNewCollection ? null : collection.collectionId),
                name: collection.name,
                description: collection.description || `Collection for project ${selectedProject}`,
                projectId: actualProjectId,
                projectEntity: {
                    id: actualProjectId,
                    projectId: actualProjectId
                },
                requests: (collection.requests || []).map(req => {
                    const isNewReq = isTransientId(req.requestId || req.id);
                    const actualId = isNewReq ? null : (req.id || req.requestId);
                    return {
                        id: actualId,
                        requestId: actualId,
                        name: req.name,
                        url: req.url,
                        method: req.method,
                        body: (() => {
                            const val = req.body;
                            if (typeof val !== 'string') {
                                const s = JSON.stringify(val || {});
                                return (s === '{}' || s === '[]') ? '' : s;
                            }
                            try {
                                const minified = JSON.stringify(JSON.parse(val));
                                return (minified === '{}' || minified === '[]') ? '' : minified;
                            } catch (e) {
                                return (val === '{}' || val === '[]') ? '' : val;
                            }
                        })(),
                        headers: (() => {
                            const val = req.headers;
                            if (typeof val !== 'string') {
                                const s = JSON.stringify(val || {});
                                return (s === '{}' || s === '[]') ? '' : s;
                            }
                            try {
                                const minified = JSON.stringify(JSON.parse(val));
                                return (minified === '{}' || minified === '[]') ? '' : minified;
                            } catch (e) {
                                return (val === '{}' || val === '[]') ? '' : val;
                            }
                        })()
                    };
                })
            };

            const authToken = user?.token || sessionStorage.getItem('authToken');
            if (!authToken || authToken === 'mock-token') {
                console.warn("WARNING: Token is missing or invalid before saving collection:", authToken);
            }

            console.log("DEBUG: Saving collection with payload:", JSON.stringify(payload, null, 2));
            const result = await createUpdateCollections(payload, authToken);

            // Normalize result to ensure requests have requestId
            const normalizedResult = {
                ...result,
                requests: (result.requests || []).map(req => ({
                    ...req,
                    requestId: req.requestId || req.id || req.requestId // Fallback to id if requestId missing
                }))
            };

            setCollections(collections.map(col =>
                col.collectionId === collection.collectionId
                    ? {
                        ...col,
                        ...normalizedResult,
                        originalName: normalizedResult.name || col.name,
                        modified: false
                    }
                    : col
            ));
            alert('Collection saved successfully!');
        } catch (error) {
            console.error('Error saving collection:', error);
            alert('Failed to save collection: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = (type, data) => {
        if (!selectedAppCodeId) return;

        try {
            if (type === 'collection') {
                const parsed = JSON.parse(data);
                // Handle Postman Format v2.1 or generic
                let newCol = {
                    collectionId: `import-${Date.now()}`,
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
                                requestId: `import-req-${Date.now()}-${Math.random()}`,
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

                setCollections(prev => {
                    const existingIndex = prev.findIndex(c => c.name === newCol.name);
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        const existing = updated[existingIndex];

                        // Update existing collection with new requests
                        // We keep the existing collectionId so saving it performs an update
                        updated[existingIndex] = {
                            ...existing,
                            requests: newCol.requests.map(r => ({
                                ...r,
                                collectionId: existing.collectionId // Bind requests to existing collection
                            })),
                            modified: true
                        };
                        alert(`Collection "${newCol.name}" found. Overriding with imported content.`);
                        return updated;
                    }
                    return [...prev, newCol];
                });
            } else if (type === 'curl') {
                // Very basic curl parsing
                const methodMatch = data.match(/-X\s+([A-Z]+)/);
                const urlMatch = data.match(/['"](http.*?)['"]/);
                const headerMatches = [...data.matchAll(/-H\s+['"](.*?)['"]/g)];
                const dataMatch = data.match(/--data\s+['"](.*?)['"]/);

                const newReq = {
                    requestId: `curl - ${Date.now()} `,
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
                        collectionId: `curl - col - ${Date.now()} `,
                        name: 'cURL Imports',
                        requests: [{ ...newReq, collectionId: `curl - col - ${Date.now()} ` }]
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

                    {/* Project Dropdown */}
                    <div className="mb-3">
                        <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">Project</label>
                        <select
                            value={selectedProject}
                            onChange={(e) => {
                                const proj = e.target.value;
                                setSelectedProject(proj);
                                setSelectedModule(''); // Reset module when project changes
                                setSelectedAppCodeId('');
                            }}
                            className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:border-red-500 dark:text-white"
                        >
                            <option value="">Select Project...</option>
                            {[...new Set(assignedAppCodes.map(ac => ac.projectName || ac.appCode))].filter(Boolean).map(pName => (
                                <option key={pName} value={pName}>{pName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Module Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-400">Module</label>
                        <select
                            value={selectedModule}
                            onChange={(e) => {
                                const mod = e.target.value;
                                setSelectedModule(mod);
                                if (selectedProject && mod) {
                                    const ac = assignedAppCodes.find(item =>
                                        (item.projectName === selectedProject || item.appCode === selectedProject) &&
                                        item.moduleName === mod
                                    );
                                    if (ac) {
                                        setSelectedAppCodeId(ac.projectId || ac.id);
                                    }
                                } else {
                                    setSelectedAppCodeId('');
                                }
                            }}
                            className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:border-red-500 dark:text-white"
                            disabled={!selectedProject}
                        >
                            <option value="">Select Module...</option>
                            {selectedProject && assignedAppCodes
                                .filter(ac => (ac.projectName === selectedProject || ac.appCode === selectedProject))
                                .map(ac => (
                                    <option key={ac.moduleName} value={ac.moduleName}>{ac.moduleName}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {selectedAppCodeId && (
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search collections..."
                                value={collectionSearchTerm}
                                onChange={(e) => setCollectionSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded pl-7 pr-2 py-1 text-[11px] outline-none focus:border-red-500/50 transition-all dark:text-white"
                            />
                            {collectionSearchTerm && (
                                <button
                                    onClick={() => setCollectionSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {!selectedAppCodeId ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                            Select an App Code to view collections
                        </div>
                    ) : isLoading ? (
                        <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
                    ) : (
                        <div className="space-y-0.5 px-2">
                            {collections.filter(col => {
                                if (!collectionSearchTerm) return true;
                                const term = collectionSearchTerm.toLowerCase();
                                return col.name?.toLowerCase().includes(term) ||
                                    col.requests?.some(r => r.name?.toLowerCase().includes(term) || r.method?.toLowerCase().includes(term));
                            }).map(col => (
                                <div key={col.collectionId}>
                                    <div
                                        className={`flex items-center gap-1 p-1 rounded group transition-colors ${expandedCollections.has(col.collectionId) ? '' : 'hover:bg-slate-200 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <button
                                            onClick={() => !renamingCollectionId && toggleCollection(col.collectionId)}
                                            className="p-0.5"
                                        >
                                            {expandedCollections.has(col.collectionId) ?
                                                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> :
                                                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                            }
                                        </button>

                                        <Folder className="w-4 h-4 text-yellow-600 shrink-0" />

                                        {renamingCollectionId === col.collectionId ? (
                                            <RenameInput
                                                value={renameValue}
                                                onChange={setRenameValue}
                                                onConfirm={handleConfirmRename}
                                            />
                                        ) : (
                                            <div
                                                className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
                                                onClick={() => !renamingCollectionId && toggleCollection(col.collectionId)}
                                            >
                                                <span className={`text-xs truncate flex-1 ${(col.name !== col.originalName || col.modified || col.collectionId.toString().startsWith('new-'))
                                                    ? 'font-bold text-slate-900 dark:text-white'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {col.name}
                                                </span>

                                                {/* Show Save button if modified */}
                                                {(col.name !== col.originalName || col.modified || col.collectionId.toString().startsWith('new-')) && (
                                                    <button
                                                        onClick={(e) => handleSaveCollection(e, col)}
                                                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                                                        title="Save Collection"
                                                        disabled={isLoading}
                                                    >
                                                        <Save className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {renamingCollectionId !== col.collectionId && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuCollectionId(activeMenuCollectionId === col.collectionId ? null : col.collectionId);
                                                        }}
                                                        className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
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

                                    {(expandedCollections.has(col.collectionId) || !!collectionSearchTerm) && (
                                        <div className="ml-4 space-y-0.5">
                                            {(!col.requests || col.requests.length === 0) ? (
                                                <div className="text-xs text-slate-400 italic py-1 px-2">No requests</div>
                                            ) : (
                                                col.requests
                                                    .filter(req => {
                                                        if (!collectionSearchTerm) return true;
                                                        const term = collectionSearchTerm.toLowerCase();
                                                        return col.name?.toLowerCase().includes(term) ||
                                                            req.name?.toLowerCase().includes(term) ||
                                                            req.method?.toLowerCase().includes(term);
                                                    })
                                                    .map(req => (
                                                        <div
                                                            key={req.requestId}
                                                            className={`flex items-center gap-2 p-1 rounded group cursor-pointer ${editingRequest && editingRequest.requestId && editingRequest.requestId === req.requestId
                                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                                                                : 'hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                                                }`}
                                                            onClick={() => { setEditingRequest({ ...req, collectionId: col.collectionId }); setIsCreatingRequest(false); }}
                                                        >
                                                            <FileText className="w-3 h-3 shrink-0" />

                                                            <span className={`text-[10px] font-bold uppercase w-12 shrink-0 ${req.method === 'GET' ? 'text-green-500' :
                                                                req.method === 'POST' ? 'text-yellow-500' :
                                                                    req.method === 'PUT' ? 'text-blue-500' :
                                                                        req.method === 'DELETE' ? 'text-red-500' : 'text-purple-500'
                                                                }`}>
                                                                {req.method}
                                                            </span>

                                                            <span className="text-xs truncate flex-1">
                                                                {req.name}
                                                            </span>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); confirmDeleteRequest(col.collectionId, req.requestId); }}
                                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-500 transition-opacity"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))
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
                            {panelEnvironments.length > 0 && (
                                <div className="flex items-center gap-2 mr-2">
                                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                                    <select
                                        value={selectedEnvId}
                                        onChange={(e) => setSelectedEnvId(e.target.value)}
                                        className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none focus:border-red-500 dark:text-white min-w-[120px]"
                                    >
                                        {panelEnvironments.map(env => (
                                            <option key={env.id} value={env.id}>{env.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
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
                            key={editingRequest.requestId}
                            request={editingRequest}
                            isCreating={isCreatingRequest}
                            onClose={() => { setEditingRequest(null); setIsCreatingRequest(false); setCreatingForCollection(null); }}
                            onSave={handleSaveRequest}
                            activeEnv={panelEnvironments.find(e => e.id === selectedEnvId)}
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

const STANDARD_HEADERS = [
    'Accept', 'Accept-Encoding', 'Accept-Language', 'Authorization', 'Cache-Control',
    'Connection', 'Content-Length', 'Content-Type', 'Cookie', 'Host', 'Origin',
    'Pragma', 'Referer', 'User-Agent', 'X-Requested-With', 'X-Api-Key', 'X-Auth-Token'
];


function RequestEditorPanel({ request, isCreating, onClose, onSave, activeEnv }) {
    const [editedReq, setEditedReq] = useState(() => {
        const req = { ...request };
        let b = req.body;
        // Robustly unwrap multi-stringified body
        while (typeof b === 'string' && b.length > 0) {
            try {
                const parsed = JSON.parse(b);
                // If it's still a string or it's an object, we keep the parsed version
                // but we only continue loop if it was a stringified string
                if (typeof parsed === 'string') {
                    b = parsed;
                    continue;
                }
                b = parsed;
                break;
            } catch (e) { break; }
        }

        if (typeof b === 'object' && b !== null) {
            req.body = JSON.stringify(b, null, 2);
        } else if (typeof b === 'string' && b.length > 0) {
            try {
                // If it's a string, try to parse and re-stringify with formatting
                const parsed = JSON.parse(b);
                req.body = JSON.stringify(parsed, null, 2);
            } catch (e) {
                req.body = b;
            }
        } else {
            req.body = String(b || '');
        }
        return req;
    });

    const [headers, setHeaders] = useState(() => {
        let h = request.headers;
        // Robustly unwrap multi-stringified headers
        while (typeof h === 'string' && h.length > 0) {
            try {
                const parsed = JSON.parse(h);
                if (typeof parsed === 'string') {
                    h = parsed;
                    continue;
                }
                h = parsed;
                break;
            } catch (e) { break; }
        }
        h = typeof h === 'object' && h !== null ? h : {};
        return Object.entries(h).map(([key, value]) => ({ key, value: String(value), id: Math.random() }));
    });

    const [autocomplete, setAutocomplete] = useState({
        show: false,
        filterText: '',
        position: { top: 0, left: 0 },
        field: '', // 'url', 'body', 'header-value', 'header-key'
        headerId: null,
        selectionStart: 0,
        activeIndex: 0,
        type: 'variable' // 'variable' or 'header'
    });

    const autocompleteRef = useRef(null);

    const handleInputChange = (field, value, e, headerId = null) => {
        if (field === 'url' || field === 'body') {
            setEditedReq(prev => ({ ...prev, [field]: value }));
        } else if (field === 'header-key') {
            setHeaders(headers.map(h => h.id === headerId ? { ...h, key: value } : h));
        } else if (field === 'header-value') {
            setHeaders(headers.map(h => h.id === headerId ? { ...h, value: value } : h));
        }

        const target = e.target;
        const cursorPos = target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');

        if (lastOpenBraces !== -1 && lastOpenBraces >= textBeforeCursor.lastIndexOf('}}')) {
            const filterText = textBeforeCursor.substring(lastOpenBraces + 2);
            if (!filterText.includes(' ')) {
                const rect = target.getBoundingClientRect();
                setAutocomplete({
                    show: true,
                    filterText,
                    position: {
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.left + window.scrollX
                    },
                    field: field,
                    headerId: headerId,
                    selectionStart: lastOpenBraces,
                    activeIndex: 0,
                    type: 'variable'
                });
                return;
            }
        }

        // Special case for header-key standard suggestions
        if (field === 'header-key' && value.length > 0) {
            const rect = target.getBoundingClientRect();
            setAutocomplete({
                show: true,
                filterText: value,
                position: {
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX
                },
                field: field,
                headerId: headerId,
                selectionStart: 0,
                activeIndex: 0,
                type: 'header'
            });
            return;
        }

        setAutocomplete(prev => ({ ...prev, show: false }));
    };

    const handleKeyDown = (e) => {
        if (!autocomplete.show) return;

        let items = [];
        if (autocomplete.type === 'variable') {
            items = (activeEnv?.variables || []).filter(v =>
                v.key.toLowerCase().includes(autocomplete.filterText.toLowerCase())
            );
        } else if (autocomplete.type === 'header') {
            items = STANDARD_HEADERS.filter(h =>
                h.toLowerCase().includes(autocomplete.filterText.toLowerCase())
            );
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex + 1) % (items.length || 1)
            }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAutocomplete(prev => ({
                ...prev,
                activeIndex: (prev.activeIndex - 1 + items.length) % (items.length || 1)
            }));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (items[autocomplete.activeIndex]) {
                e.preventDefault();
                const selectedKey = items[autocomplete.activeIndex].key || items[autocomplete.activeIndex];
                handleVariableSelect(selectedKey, autocomplete.type === 'variable');
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setAutocomplete(prev => ({ ...prev, show: false }));
        }
    };

    const handleVariableSelect = (varName, isVar) => {
        const insertText = isVar ? `{{${varName}}}` : varName;
        let newValue = '';
        const targetField = autocomplete.field;
        const searchLength = isVar ? autocomplete.filterText.length + 2 : autocomplete.filterText.length;

        if (targetField === 'url' || targetField === 'body') {
            const current = editedReq[targetField] || '';
            const before = current.substring(0, autocomplete.selectionStart);
            const after = current.substring(autocomplete.selectionStart + searchLength);
            newValue = before + insertText + after;
            setEditedReq(prev => ({ ...prev, [targetField]: newValue }));
        } else if (targetField === 'header-value' || targetField === 'header-key') {
            const prop = targetField === 'header-key' ? 'key' : 'value';
            setHeaders(headers.map(h => {
                if (h.id === autocomplete.headerId) {
                    const current = h[prop] || '';
                    const before = current.substring(0, autocomplete.selectionStart);
                    const after = current.substring(autocomplete.selectionStart + searchLength);
                    return { ...h, [prop]: before + insertText + after };
                }
                return h;
            }));
        }

        setAutocomplete(prev => ({ ...prev, show: false }));
    };

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

    const resolvedUrl = replaceEnvVariables(editedReq.url, activeEnv);
    let resolvedBody = replaceEnvVariables(editedReq.body || '', activeEnv);

    // Format preview body if it's JSON
    if (resolvedBody.trim().startsWith('{') || resolvedBody.trim().startsWith('[')) {
        try {
            resolvedBody = JSON.stringify(JSON.parse(resolvedBody), null, 2);
        } catch (e) {
            // Not valid JSON, leave as is
        }
    }

    const hasVariablesInUrl = resolvedUrl !== editedReq.url;
    const hasVariablesInBody = resolvedBody !== (editedReq.body || '');

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
                            onChange={e => handleInputChange('url', e.target.value, e)}
                            onKeyDown={handleKeyDown}
                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-white font-mono focus:border-red-500 outline-none"
                            placeholder="https://api.example.com/endpoint"
                        />
                        {hasVariablesInUrl && (
                            <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Preview:</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{resolvedUrl}</span>
                            </div>
                        )}
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
                                        onChange={e => handleInputChange('header-key', e.target.value, e, header.id)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Key"
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 dark:text-white focus:border-red-500 outline-none"
                                    />
                                    <div className="flex-1 flex flex-col">
                                        <input
                                            type="text"
                                            value={header.value}
                                            onChange={e => handleInputChange('header-value', e.target.value, e, header.id)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Value"
                                            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 dark:text-white focus:border-red-500 outline-none"
                                        />
                                        {header.value.includes('{{') && (
                                            <span className="text-[9px] text-slate-400 px-1 truncate">
                                                {replaceEnvVariables(header.value, activeEnv)}
                                            </span>
                                        )}
                                    </div>
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
                        onChange={e => handleInputChange('body', e.target.value, e)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded text-sm font-mono h-40 bg-white dark:bg-slate-800 dark:text-white resize-none focus:border-red-500 outline-none"
                        placeholder="{}"
                    />
                    {hasVariablesInBody && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-md">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Preview (Resolved):</div>
                            <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap">
                                {resolvedBody}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {autocomplete.show && (
                <VariableAutocomplete
                    variables={activeEnv?.variables}
                    standardHeaders={STANDARD_HEADERS}
                    filterText={autocomplete.filterText}
                    type={autocomplete.type}
                    onSelect={handleVariableSelect}
                    position={autocomplete.position}
                    activeIndex={autocomplete.activeIndex}
                    onCancel={() => setAutocomplete(prev => ({ ...prev, show: false }))}
                />
            )}
        </div>
    );
}
