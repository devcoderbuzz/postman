import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCollectionsByProjectId, getAllProjects, getEnvDetails, updateEnvDetails, getAllAppCodes, getCollectionDetails, createUpdateEnvVariable, deleteVariable, renameEnv, deleteEnvDetails } from '../services/apiservice';
import { Layout } from '../components/Layout';
import { RequestBar } from '../components/RequestBar';
import { Tabs } from '../components/Tabs';
import { KeyValueEditor } from '../components/KeyValueEditor';
import { ResponseViewer } from '../components/ResponseViewer';
import { BodyEditor } from '../components/BodyEditor';
import { AuthEditor } from '../components/AuthEditor';
import { CollectionsPanel } from '../components/CollectionsPanel';
import { HistoryPanel } from '../components/HistoryPanel';
import { EnvironmentManager } from '../components/EnvironmentManager';
import { RequestTabs } from '../components/RequestTabs';
import { Footer } from '../components/Footer';
import { X, Save, Moon, Sun, Globe, Check, AlignLeft, Settings as SettingsIcon, Code2, ShieldCheck, Clock, Trash2, Plus } from 'lucide-react';
import { cn, replaceEnvVariables } from '../lib/utils';
import { SaveRequestModal } from '../components/SaveRequestModal';
import { Header } from '../components/Header';
import { Settings } from '../components/Settings';
import { ImportModal } from '../components/ImportModal';
import { EditDataPanel } from '../components/EditDataModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';

function ConsoleSection({ title, children, defaultExpanded = false, className = "" }) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <div className={cn("ml-2", className)}>
            <div
                className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 py-0.5 rounded px-1 select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="text-slate-400">
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">{title}</span>
            </div>
            {expanded && (
                <div className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-2 my-1">
                    {children}
                </div>
            )}
        </div>
    );
}

function JsonTree({ data }) {
    if (typeof data !== 'object' || data === null) {
        // Primitive values
        const isString = typeof data === 'string';
        return (
            <span className={cn(
                "break-all",
                isString ? "text-green-600 dark:text-[#a8ff60]" : "text-orange-600 dark:text-[#ce9178]"
            )}>
                {isString ? `"${data}"` : String(data)}
            </span>
        );
    }

    return (
        <div className="font-mono text-[11px] leading-relaxed">
            {Object.entries(data).map(([key, value], index) => {
                const isObject = typeof value === 'object' && value !== null;
                return (
                    <div key={key} className="flex">
                        <span className="text-blue-600 dark:text-[#9cdcfe] mr-1">"{key}":</span>
                        {isObject ? (
                            <div className="flex-1">
                                <span>{'{'}</span>
                                <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                                    <JsonTree data={value} />
                                </div>
                                <span>{'}'}{index < Object.keys(data).length - 1 ? ',' : ''}</span>
                            </div>
                        ) : (
                            <span>
                                <JsonTree data={value} />
                                {index < Object.keys(data).length - 1 ? ',' : ''}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function ConsoleItem({ item, isLatest }) {
    const [expanded, setExpanded] = useState(false);

    // Helper to parse if string
    const parseIfString = (data) => {
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return data; }
        }
        return data;
    }

    const requestBody = parseIfString(item.requestBody);
    const responseBody = parseIfString(item.responseData);

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 last:border-0 font-mono text-[11px]">
            {/* Top Level Request Line */}
            <div
                className={cn(
                    "flex gap-2 py-1 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 items-center",
                    expanded ? "bg-slate-50 dark:bg-slate-800/50" : "",
                    isLatest ? "font-bold text-slate-900 dark:text-white" : "opacity-60 grayscale hover:opacity-100 transition-all"
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="text-slate-400">
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>

                {/* Timestamp */}
                <span className="w-16 text-slate-500 text-[10px] font-mono shrink-0">
                    {item.timestamp ? item.timestamp.split(' ')[1] : ''}
                </span>

                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <span className={cn(
                        "font-bold",
                        item.method === 'GET' && "text-purple-600 dark:text-purple-400",
                        item.method === 'POST' && "text-yellow-600 dark:text-yellow-400",
                        item.method === 'PUT' && "text-blue-600 dark:text-blue-400",
                        item.method === 'DELETE' && "text-red-600 dark:text-red-400"
                    )}>{item.method}</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate">{item.url}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                    <span className={cn(
                        "font-bold",
                        item.status >= 200 && item.status < 300 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>{item.status}</span>
                    <span className="text-slate-400">{item.time}ms</span>
                </div>
            </div>

            {
                expanded && (
                    <div className="pb-2 bg-white dark:bg-[#0d1117] text-slate-600 dark:text-[#d4d4d4]">
                        {/* Network Section */}
                        {/* <ConsoleSection title="Network">
                        <div className="grid grid-cols-[100px_1fr] gap-1 text-[11px]">
                            <span className="text-slate-400">Status Code:</span>
                            <span className={item.status < 300 ? "text-green-600" : "text-red-600"}>{item.status}</span>
                            <span className="text-slate-400">Duration:</span>
                            <span>{item.time} ms</span>
                        </div>
                    </ConsoleSection> */}

                        {/* Request Headers */}
                        <ConsoleSection title="Request Headers">
                            <div className="space-y-0.5">
                                {Object.entries(item.requestHeaders || {}).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="text-slate-500 dark:text-[#858585]">{key}:</span>
                                        <span className="text-blue-600 dark:text-[#9cdcfe]">"{String(value)}"</span>
                                    </div>
                                ))}
                            </div>
                        </ConsoleSection>

                        {/* Request Body */}
                        {item.requestBody && (
                            <ConsoleSection title="Request Body">
                                {typeof requestBody === 'object' ? (
                                    <div className="ml-2">
                                        <span>{'{'}</span>
                                        <div className="pl-2 border-l border-slate-200 dark:border-slate-800 my-0.5">
                                            <JsonTree data={requestBody} />
                                        </div>
                                        <span>{'}'}</span>
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap text-blue-600 dark:text-[#ce9178]">{item.requestBody}</pre>
                                )}
                            </ConsoleSection>
                        )}

                        {/* Response Headers */}
                        <ConsoleSection title="Response Headers">
                            <div className="space-y-0.5">
                                {Object.entries(item.responseHeaders || {}).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="text-slate-500 dark:text-[#858585]">{key}:</span>
                                        <span className="text-blue-600 dark:text-[#9cdcfe]">"{String(value)}"</span>
                                    </div>
                                ))}
                            </div>
                        </ConsoleSection>

                        {/* Response Body */}
                        {item.responseData && (
                            <ConsoleSection title="Response Body" defaultExpanded={true}>
                                {typeof responseBody === 'object' ? (
                                    <div className="ml-2">
                                        <span>{'{'}</span>
                                        <div className="pl-2 border-l border-slate-200 dark:border-slate-800 my-0.5">
                                            <JsonTree data={responseBody} />
                                        </div>
                                        <span>{'}'}</span>
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap text-green-600 dark:text-[#ce9178]">{String(item.responseData)}</pre>
                                )}
                            </ConsoleSection>
                        )}
                    </div>
                )
            }
        </div >
    );
}

export function UserWorkspace() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Request state - Array of requests
    const [requests, setRequests] = useState([{
        id: 'default',
        name: 'New Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        params: [{ key: '', value: '', active: true }],
        headers: [{ key: '', value: '', active: true }],
        bodyType: 'none',
        rawType: 'JSON',
        body: '',
        authType: 'none',
        authData: {},
        response: null,
        error: null,
        isLoading: false
    }]);
    const [activeRequestId, setActiveRequestId] = useState('default');

    // Derived active request
    const activeRequest = (requests.find(r => r.id === activeRequestId) || requests[0] || {});

    // Helper to update active request
    const updateActiveRequest = (updates) => {
        setRequests(prev => prev.map(req =>
            req.id === activeRequestId ? { ...req, ...updates } : req
        ));
    };

    const [activeCollectionId, setActiveCollectionId] = useState(null);

    // UI state
    const [activeTab, setActiveTab] = useState('params'); // Internal tab (Params/Headers/etc)
    const [activeView, setActiveView] = useState('collections');
    const { theme, setTheme } = useTheme();
    const [layout, setLayout] = useState('horizontal'); // 'vertical' or 'horizontal'
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showImportCurlModal, setShowImportCurlModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || '');
    const [localCollectionsPath, setLocalCollectionsPath] = useState(localStorage.getItem('localCollectionsPath') || '');
    const [showEnvSaveSuccess, setShowEnvSaveSuccess] = useState(false);
    const [editDataRefreshTrigger, setEditDataRefreshTrigger] = useState(0);

    const handleRefreshView = (view) => {
        if (view === 'editData') {
            setEditDataRefreshTrigger(prev => prev + 1);
        } else if (view === 'collections') {
            fetchWorkspaceData();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        if (profilePic) {
            localStorage.setItem('profilePic', profilePic);
        }
    }, [profilePic]);

    useEffect(() => {
        if (localCollectionsPath) {
            localStorage.setItem('localCollectionsPath', localCollectionsPath);
        }
    }, [localCollectionsPath]);

    // Layout state
    const [collectionsPanelWidth, setCollectionsPanelWidth] = useState(240);
    const [requestPanelHeight, setRequestPanelHeight] = useState(window.innerHeight / 2 - 80); // Vertically balanced
    const [requestPanelWidth, setRequestPanelWidth] = useState((window.innerWidth - 260) / 2); // Horizontally balanced
    const [isResizingRequest, setIsResizingRequest] = useState(false);
    const [consoleHeight, setConsoleHeight] = useState(200);
    const [isResizingConsole, setIsResizingConsole] = useState(false);

    // Project state
    const placeholderProjects = [{ id: 'default', name: 'Default Project' }];
    const [projects, setProjects] = useState(placeholderProjects);
    const [activeAppCodeName, setActiveAppCodeName] = useState('default');

    const [rawAppCodes, setRawAppCodes] = useState([]);
    const [activeModule, setActiveModule] = useState('default');
    const [modules, setModules] = useState([]);

    // Fetch collections when module changes
    useEffect(() => {
        if (activeAppCodeName && activeModule && rawAppCodes.length > 0) {
            // Find the app code object that matches the active project and module
            const selectedApp = rawAppCodes.find(app =>
                app.projectName === activeAppCodeName && app.moduleName === activeModule
            );

            if (selectedApp) {
                const pid = selectedApp.projectId || selectedApp.appCode || selectedApp.id;
                if (pid) {
                    fetchServerCollections(pid);
                } else {
                    console.warn('ID not found for selection:', activeAppCodeName, activeModule);
                    setServerCollections([]);
                }
            } else {
                setServerCollections([]);
            }
        }
    }, [activeAppCodeName, activeModule, rawAppCodes]);

    const fetchServerCollections = async (projectId) => {
        try {
            let fetchedCollections = null;

            // Try to find in rawAppCodes first (since we loaded hierarchy for user/dev)
            const localProject = rawAppCodes.find(app => {
                const apid = String(app.projectId || app.appCode || app.id);
                const targetId = String(projectId);
                return apid === targetId;
            });

            if (localProject && localProject.collections) {
                console.log(`Using cached collections for ID: ${projectId}`);
                fetchedCollections = localProject.collections;
            } else {
                console.log(`Fetching collections for Project ID: ${projectId}`);
                fetchedCollections = await getCollectionsByProjectId(projectId);
            }

            if (fetchedCollections && Array.isArray(fetchedCollections)) {
                const mappedCollections = fetchedCollections.map(col => {
                    const cid = col.id || col.collectionId || (Date.now().toString() + Math.random());
                    return {
                        ...col,
                        id: String(cid),
                        collectionId: cid,
                        name: col.name,
                        requests: col.requests ? col.requests.map(req => ({
                            ...req,
                            id: req.id || req.requestId || (Date.now().toString() + Math.random()),
                            requestId: req.requestId || req.id,
                            name: req.name,
                            method: req.method,
                            url: req.url,
                            params: req.params || [],
                            headers: (() => {
                                if (!req.headers) return [];
                                let headersObj = req.headers;

                                // If it's already an object, map it
                                if (typeof headersObj === 'object' && headersObj !== null) {
                                    return Object.entries(headersObj).map(([k, v]) => ({ key: k, value: String(v), active: true }));
                                }

                                // If it's a string, try parsing
                                if (typeof headersObj === 'string') {
                                    try {
                                        const parsed = JSON.parse(headersObj);
                                        if (parsed && typeof parsed === 'object') {
                                            return Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v), active: true }));
                                        }
                                    } catch (e) { }

                                    // Loose Parse
                                    try {
                                        const cleanStr = headersObj.trim().replace(/^{|}$/g, '');
                                        const pairs = cleanStr.split(',').map(p => p.trim()).filter(p => p);
                                        const mapped = pairs.map(pair => {
                                            const firstColon = pair.indexOf(':');
                                            if (firstColon === -1) return null;
                                            const key = pair.slice(0, firstColon).trim().replace(/^['"]|['"]$/g, '');
                                            const value = pair.slice(firstColon + 1).trim().replace(/^['"]|['"]$/g, '');
                                            return { key, value, active: true };
                                        }).filter(p => p);
                                        if (mapped.length > 0) return mapped;
                                    } catch (e) { }
                                }
                                return [];
                            })(),
                            body: req.body,
                            bodyType: req.body ? 'raw' : 'none',
                            rawType: 'JSON',
                            authType: 'none',
                            authData: {}
                        })) : []
                    };
                });

                setServerCollections(mappedCollections);
            } else {
                setServerCollections([]);
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
        }
    };

    const refreshModule = () => {
        if (activeAppCodeName && activeModule && rawAppCodes.length > 0) {
            const selectedApp = rawAppCodes.find(app =>
                app.projectName === activeAppCodeName && app.moduleName === activeModule
            );
            if (selectedApp && selectedApp.projectId) {
                fetchServerCollections(selectedApp.projectId);
                fetchEnvironments(activeAppCodeName, activeModule);
            }
        }
    };

    // Update modules when activeAppCodeName (projectName) changes
    useEffect(() => {
        if (activeAppCodeName && rawAppCodes.length > 0) {
            const projectAppCodes = rawAppCodes.filter(app => app.projectName === activeAppCodeName);
            const uniqueModules = [...new Set(projectAppCodes.map(app => app.moduleName))]
                .map(name => ({ id: name, name: name }));

            setModules(uniqueModules);
            if (uniqueModules.length > 0) {
                setActiveModule(uniqueModules[0].id);
            } else {
                setActiveModule('');
                setServerCollections([]);
            }
        } else {
            setModules([]);
            setServerCollections([]);
        }
    }, [activeAppCodeName, rawAppCodes]);

    // Collections & Environments
    const [serverCollections, setServerCollections] = useState([]);
    const [localCollections, setLocalCollections] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [activeEnv, setActiveEnv] = useState(null);
    const [history, setHistory] = useState([]);

    // Load from localStorage
    useEffect(() => {
        const savedCollections = localStorage.getItem('collections');
        const savedHistory = localStorage.getItem('consoleHistory');
        const savedLayout = localStorage.getItem('layout');
        if (savedCollections) setLocalCollections(JSON.parse(savedCollections));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedLayout) setLayout(savedLayout);
    }, []);

    // Save layout preference
    useEffect(() => {
        localStorage.setItem('layout', layout);
    }, [layout]);

    // Apply theme to document - Now handled by ThemeContext
    /*
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);
    */

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('collections', JSON.stringify(localCollections));
    }, [localCollections]);

    // Console / Footer State
    const [showConsole, setShowConsole] = useState(false);
    const latestRequest = history.length > 0 ? history[0] : null;

    useEffect(() => {
        localStorage.setItem('consoleHistory', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('environments', JSON.stringify(environments));
    }, [environments]);

    // Resize logic for Request/Response split
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRequest) return;
            if (layout === 'vertical') {
                const newHeight = e.clientY - 120;
                if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
                    setRequestPanelHeight(newHeight);
                }
            } else {
                const newWidth = e.clientX - collectionsPanelWidth - 60;
                if (newWidth >= 300 && newWidth <= window.innerWidth - 400) {
                    setRequestPanelWidth(newWidth);
                }
            }
        };
        const handleMouseUp = () => { setIsResizingRequest(false); };
        if (isResizingRequest) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizingRequest]);

    // Resize logic for Console
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingConsole) return;
            const newHeight = window.innerHeight - e.clientY - 32; // 32 for footer height
            if (newHeight >= 40 && newHeight <= window.innerHeight - 200) {
                setConsoleHeight(newHeight);
            }
        };
        const handleMouseUp = () => { setIsResizingConsole(false); };
        if (isResizingConsole) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizingConsole]);

    const fetchEnvironments = async (appCode = activeAppCodeName, moduleName = activeModule, appCodesData = null) => {
        if (!user) return;
        try {
            console.log("fetchEnvironments context:", { appCode, moduleName });

            // Find selected project details to get the ID
            const source = appCodesData || rawAppCodes;
            const selectedApp = source.find(app =>
                (app.projectName === appCode || app.appCode === appCode) && app.moduleName === moduleName
            );
            if (!selectedApp) {
                console.warn('Selected app not found for:', appCode, moduleName);
                return;
            }

            const targetProjectId = selectedApp.projectId || selectedApp.id;
            console.log(`Fetching environments for Project ID: ${targetProjectId}`);

            const envData = await getEnvDetails(targetProjectId, user.token);
            if (!envData) {
                setEnvironments([]);
                setActiveEnv(null);
                return;
            }

            let environmentsToProcess = [];

            // Handle different possible response structures
            if (Array.isArray(envData)) {
                // Check if it's the structure [ { environments: [...] } ]
                if (envData.length > 0 && envData[0].environments && Array.isArray(envData[0].environments)) {
                    environmentsToProcess = envData.flatMap(p => p.environments || []);
                } else {
                    // If it returns an array of environments directly
                    environmentsToProcess = envData;
                }
            } else if (envData.environments && Array.isArray(envData.environments)) {
                // If it returns a project object containing environments
                environmentsToProcess = envData.environments;
            } else if (Array.isArray(envData.data)) {
                // If it's wrapped in a data field
                environmentsToProcess = envData.data;
            }

            if (environmentsToProcess.length > 0) {
                const formattedEnvs = environmentsToProcess.map(env => ({
                    id: String(env.envID || env.id || env.envName),
                    name: env.envName || env.name,
                    variables: (env.variables || []).map(v => {
                        const k = v.variableKey || v.key || '';
                        const val = String(v.variableValue || v.value || '');
                        return {
                            id: v.id,
                            key: k,
                            value: val,
                            active: true,
                            originalKey: k,
                            originalValue: val
                        };
                    })
                }));

                setEnvironments(formattedEnvs);

                if (formattedEnvs.length > 0) {
                    if (!activeEnv || !formattedEnvs.find(e => e.id === activeEnv)) {
                        setActiveEnv(formattedEnvs[0].id);
                    }
                } else {
                    setActiveEnv(null);
                }
            } else {
                setEnvironments([]);
                setActiveEnv(null);
            }
        } catch (e) {
            console.error('Failed to fetch environment details:', e);
            setEnvironments([]);
            setActiveEnv(null);
        }
    };



    // Fetches projects/collections/env data
    const fetchWorkspaceData = async () => {
        if (!user) return;

        const userRole = user.role?.toLowerCase();
        if (userRole === 'user' || userRole === 'developer' || userRole === 'dev') {
            try {
                let hierarchyData;
                const userProjectIds = user.projectIds || [];

                if (userProjectIds.length > 0) {
                    console.log("Fetching collection details for user/dev roles:", userProjectIds);
                    hierarchyData = await getCollectionDetails(userProjectIds, user.token);
                } else {
                    hierarchyData = await getAllAppCodes(user.token);
                }

                if (!hierarchyData || !Array.isArray(hierarchyData)) {
                    hierarchyData = [];
                }

                let filteredProjects = [];
                if (userProjectIds.length > 0) {
                    const idsToMatch = userProjectIds.map(String);
                    filteredProjects = hierarchyData.filter(project =>
                        idsToMatch.includes(String(project.appCode)) || idsToMatch.includes(String(project.projectId)) || idsToMatch.includes(String(project.id))
                    );
                } else if (user.assignedAppCodes && user.assignedAppCodes.length > 0) {
                    filteredProjects = user.assignedAppCodes;
                } else {
                    filteredProjects = hierarchyData;
                }

                const formattedAppCodes = filteredProjects.map(p => ({
                    ...p,
                    projectId: String(p.projectId || p.appCode || p.id),
                    projectName: p.appCode || p.projectName,
                    moduleName: p.moduleName || 'default'
                }));
                setRawAppCodes(formattedAppCodes);

                // Set up projects dropdown from the filtered list
                const uniqueProjects = [...new Set(formattedAppCodes.map(app => app.projectName))]
                    .filter(Boolean)
                    .map(name => ({ id: name, name: name }));

                let initialAppCode = activeAppCodeName;
                if (uniqueProjects.length > 0) {
                    setProjects(uniqueProjects);
                    // Initialize selection if not set or invalid
                    const currentValid = uniqueProjects.find(p => p.id === activeAppCodeName);
                    if (activeAppCodeName === 'default' || !currentValid) {
                        initialAppCode = uniqueProjects[0].id;
                        setActiveAppCodeName(initialAppCode);
                    }
                }

                // We need to determine the initial module as well to fetch envs correctly
                let initialModule = activeModule;
                const projectAppCodes = formattedAppCodes.filter(app => app.projectName === initialAppCode);
                const uniqueModules = [...new Set(projectAppCodes.map(app => app.moduleName))]
                    .map(name => ({ id: name, name: name }));

                if (uniqueModules.length > 0) {
                    initialModule = uniqueModules[0].id;
                    // Note: setModules and setActiveModule are called in a useEffect triggered by activeAppCodeName
                }

                // Fetch initial environment data using the values we just determined
                await fetchEnvironments(initialAppCode, initialModule, formattedAppCodes);
            } catch (e) {
                console.error('Failed to initialize server collections for user/dev:', e);
            }
        } else if (userRole === 'admin') {
            // Admin logic
            let initialAppCode = activeAppCodeName;
            let adminData = [];
            if (user.assignedAppCodes && user.assignedAppCodes.length > 0) {
                adminData = user.assignedAppCodes;
                setRawAppCodes(adminData);
                const uniqueProjects = [...new Set(adminData.map(app => app.projectName))]
                    .map(name => ({ id: name, name: name }));
                if (uniqueProjects.length > 0) {
                    setProjects(uniqueProjects);
                    if (activeAppCodeName === 'default') {
                        initialAppCode = uniqueProjects[0].id;
                        setActiveAppCodeName(initialAppCode);
                    }
                }
            } else {
                try {
                    const fetchedData = await getAllProjects();
                    if (fetchedData && Array.isArray(fetchedData)) {
                        adminData = fetchedData;
                        setRawAppCodes(adminData);
                        const uniqueProjects = [...new Set(adminData.map(app => app.projectName))]
                            .map(name => ({ id: name, name: name }));
                        if (uniqueProjects.length > 0) {
                            setProjects(uniqueProjects);
                            if (activeAppCodeName === 'default') {
                                initialAppCode = uniqueProjects[0].id;
                                setActiveAppCodeName(initialAppCode);
                            }
                        }
                    }
                } catch (e) { console.error(e); }
            }
            // For admin, we don't necessarily know the module yet here, 
            // but we can try to fetch envs for the project
            await fetchEnvironments(initialAppCode, activeModule, adminData);
        }
    };

    // Refetch environments when app code or module changes
    useEffect(() => {
        if (user && activeAppCodeName && activeModule) {
            fetchEnvironments(activeAppCodeName, activeModule);
        }
    }, [activeAppCodeName, activeModule, user]);

    // INITIALIZATION: Fetch projects for the logged-in user
    useEffect(() => {
        fetchWorkspaceData();
    }, [user]);

    // Refresh when switching tabs/views
    useEffect(() => {
        if (activeView === 'collections') {
            console.log("View switched to 'collections', refreshing workspace data...");
            fetchWorkspaceData();
        }
    }, [activeView]);


    const tabs = [
        { id: 'docs', label: 'Docs', icon: AlignLeft },
        { id: 'params', label: 'Params' },
        { id: 'auth', label: 'Auth' },
        { id: 'headers', label: 'Headers', suffix: `(${activeRequest?.headers?.filter?.(h => h.key && h.active).length || 0})` },
        { id: 'body', label: 'Body', indicator: activeRequest?.body && activeRequest.body.length > 0 },
        { id: 'scripts', label: 'Scripts' },
        { id: 'tests', label: 'Tests' },
        { id: 'settings', label: 'Settings' },
    ];

    const applyAuth = (headersObj, paramsObj, request) => {
        const { authType, authData } = request;
        if (authType === 'bearer' && authData.token) {
            headersObj['Authorization'] = `Bearer ${authData.token}`;
        } else if (authType === 'basic' && authData.username && authData.password) {
            const encoded = btoa(`${authData.username}:${authData.password}`);
            headersObj['Authorization'] = `Basic ${encoded}`;
        } else if (authType === 'api-key' && authData.key && authData.value) {
            if (authData.addTo === 'header') {
                headersObj[authData.key] = authData.value;
            } else {
                paramsObj[authData.key] = authData.value;
            }
        }
    };

    const handleSend = async () => {
        updateActiveRequest({ isLoading: true, error: null, response: null });
        const request = activeRequest;
        const startTime = Date.now();
        let processedUrl = request.url;

        let headersObj = {};
        let paramsObj = {};
        let config = {
            method: request.method,
            url: processedUrl,
            headers: {},
            params: {}
        };

        try {
            const currentEnv = environments.find(env => env.id === activeEnv);
            processedUrl = replaceEnvVariables(request.url, currentEnv);
            paramsObj = request.params.reduce((acc, curr) => {
                if (curr.key && curr.active) acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
                return acc;
            }, {});
            headersObj = request.headers.reduce((acc, curr) => {
                if (curr.key && curr.active) acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
                return acc;
            }, {});

            // Add standard headers to mimic Postman/Browser and prevent 403s
            if (!headersObj['Accept']) headersObj['Accept'] = 'application/json, text/plain, */*';
            if (!headersObj['User-Agent']) headersObj['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            if (!headersObj['Accept-Language']) headersObj['Accept-Language'] = 'en-US,en;q=0.9';

            applyAuth(headersObj, paramsObj, request);

            console.log("DEBUG: Request Type Info", { bodyType: request.bodyType, rawType: request.rawType });

            if (request.bodyType !== 'none' && request.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
                // Replace environment variables in body
                const processedBody = replaceEnvVariables(request.body, currentEnv);

                const isJson = (request.bodyType || '').toLowerCase() === 'json' ||
                    (request.bodyType === 'raw' && (request.rawType || 'JSON').toUpperCase() === 'JSON');

                if (isJson) {
                    headersObj['Content-Type'] = 'application/json';
                    try {
                        config.data = JSON.parse(processedBody);
                    } catch (e) {
                        console.error("Failed to parse body as JSON:", e, "Body:", processedBody);
                        config.data = processedBody;
                    }
                } else {
                    config.data = processedBody;
                }
            }

            // Sync the latest values into config object
            config.url = processedUrl;
            config.params = paramsObj;
            config.headers = { ...headersObj };

            console.log("SENDING TO PROXY:", {
                targetUrl: config.url,
                method: config.method,
                headers: config.headers,
                data: config.data
            });

            const proxyRes = await axios({
                method: 'POST',
                url: 'http://localhost:3001/proxy',
                data: {
                    method: config.method,
                    url: config.url,
                    headers: config.headers,
                    data: config.data,
                    params: config.params
                }
            });
            const res = proxyRes.data;
            if (res.isError) {
                throw {
                    status: res.status,
                    message: res.statusText || 'Proxy Error',
                    response: {
                        status: res.status,
                        statusText: res.statusText,
                        data: res.data,
                        headers: res.headers
                    }
                };
            }
            const endTime = Date.now();
            const responseData = {
                status: res.status,
                statusText: res.statusText,
                data: res.data,
                headers: res.headers,
                time: endTime - startTime,
                size: JSON.stringify(res.data).length,
            };
            updateActiveRequest({ isLoading: false, response: responseData });
            const historyEntry = {
                id: Date.now().toString() + Math.random(),
                method: request.method,
                url: processedUrl,
                status: res.status,
                statusText: res.statusText,
                timestamp: new Date().toLocaleString(),
                params: request.params,
                headers: request.headers,
                bodyType: request.bodyType,
                body: request.body,
                authType: request.authType,
                authData: request.authData,
                requestHeaders: config.headers,
                requestBody: config.data,
                responseHeaders: res.headers,
                responseData: res.data,
                time: endTime - startTime,
                expanded: false
            };
            setHistory(prev => [historyEntry, ...prev].slice(0, 50));
        } catch (err) {
            let errorData = err;
            let responseData = null;
            if (err.response) {
                const endTime = Date.now();
                responseData = {
                    status: err.response.status,
                    statusText: err.response.statusText,
                    data: err.response.data,
                    headers: err.response.headers, // Fix: Use proxy headers
                    time: endTime - startTime,
                    size: JSON.stringify(err.response.data).length,
                };
            }
            updateActiveRequest({ isLoading: false, error: errorData, response: responseData });

            const historyEntry = {
                id: Date.now().toString() + Math.random(),
                method: request.method,
                url: processedUrl,
                status: err.response ? err.response.status : (err.status || 'Error'),
                statusText: err.response ? err.response.statusText : 'Error',
                timestamp: new Date().toLocaleString(),
                params: request.params,
                headers: request.headers,
                bodyType: request.bodyType,
                body: request.body,
                authType: request.authType,
                authData: request.authData,
                requestHeaders: config.headers,
                requestBody: config.data,
                responseHeaders: err.response ? err.response.headers : {},
                responseData: err.response ? err.response.data : (err.message || 'Network Error'),
                time: Date.now() - startTime,
                expanded: false
            };
            setHistory(prev => [historyEntry, ...prev].slice(0, 50));
        }
    };

    const saveCollectionToDb = async (collection) => {
        return new Promise(resolve => {
            setTimeout(() => { resolve(collection); }, 500);
        });
    };

    const reloadCollectionFromDb = async (collectionId) => {
        return new Promise(resolve => {
            setTimeout(() => { resolve(localCollections); }, 500);
        });
    };

    const refreshAppCode = async () => {
        await fetchWorkspaceData();
    };

    const saveToCollection = () => {
        if (localCollections.length === 0) {
            setErrorMessage('Please create a collection under local workspace first before saving requests.');
            return;
        }
        if (activeRequest.id && activeCollectionId) {
            handleSaveRequest(null, activeCollectionId, true);
        } else {
            setShowSaveModal(true);
        }
    };

    const handleSaveRequest = (requestName, collectionId, isOverwrite = false) => {
        // Minify/Clean body for saving
        let processedBody = activeRequest.body;
        if (activeRequest.body && typeof activeRequest.body === 'string' && activeRequest.bodyType === 'raw') {
            try {
                // Default to JSON if rawType is missing or explicit 'JSON'
                if (!activeRequest.rawType || activeRequest.rawType === 'JSON') {
                    // Try to parse and stringify to remove whitespace
                    const parsed = JSON.parse(activeRequest.body);
                    processedBody = JSON.stringify(parsed);
                } else {
                    // For XML/HTML/Text, remove newlines and extra spaces
                    processedBody = activeRequest.body.replace(/[\r\n]+/g, '');
                }
            } catch (e) {
                // If parsing fails, just strip newlines
                processedBody = activeRequest.body.replace(/[\r\n]+/g, '');
            }
        }

        const updatedCollections = localCollections.map(col => {
            if (col.id === collectionId) {
                let updatedRequests;
                if (isOverwrite && activeRequestId) {
                    updatedRequests = col.requests.map(req => {
                        if (req.id === activeRequestId) {
                            return {
                                ...req,
                                name: req.name || requestName,
                                method: activeRequest.method,
                                url: activeRequest.url,
                                params: activeRequest.params,
                                headers: activeRequest.headers,
                                bodyType: activeRequest.bodyType,
                                body: processedBody,
                                authType: activeRequest.authType,
                                authData: activeRequest.authData,
                            };
                        }
                        return req;
                    });
                } else {
                    const newRequest = {
                        id: Date.now().toString(),
                        name: requestName,
                        method: activeRequest.method,
                        url: activeRequest.url,
                        params: activeRequest.params,
                        headers: activeRequest.headers,
                        bodyType: activeRequest.bodyType,
                        body: processedBody,
                        authType: activeRequest.authType,
                        authData: activeRequest.authData,
                    };
                    updatedRequests = [...col.requests, newRequest];
                    updateActiveRequest({ id: newRequest.id, name: requestName });
                    setActiveRequestId(newRequest.id);
                    setActiveCollectionId(collectionId);
                }
                const updatedCol = { ...col, requests: updatedRequests };
                saveCollectionToDb(updatedCol);
                return updatedCol;
            }
            return col;
        });
        setLocalCollections(updatedCollections);
    };

    const loadRequest = (request) => {
        let reqToLoad = { ...request };

        // If it's a history item (has responseData but no response object yet)
        if (reqToLoad.responseData && !reqToLoad.response) {
            reqToLoad.response = {
                data: reqToLoad.responseData,
                headers: reqToLoad.responseHeaders,
                status: reqToLoad.status,
                statusText: reqToLoad.statusText,
                time: reqToLoad.time,
                size: reqToLoad.responseData ? JSON.stringify(reqToLoad.responseData).length : 0
            };
        }

        // Ensure all required fields exist for UI robustness
        reqToLoad.params = reqToLoad.params || [];
        reqToLoad.headers = reqToLoad.headers || [];
        reqToLoad.authType = reqToLoad.authType || 'none';
        reqToLoad.authData = reqToLoad.authData || {};
        reqToLoad.body = reqToLoad.body || '';
        reqToLoad.bodyType = reqToLoad.bodyType || 'none';
        reqToLoad.rawType = reqToLoad.rawType || 'JSON';

        // Ensure it has an ID (especially for history items)
        if (!reqToLoad.id) {
            reqToLoad.id = Date.now().toString() + Math.random();
        }

        // Ensure it has a name
        if (!reqToLoad.name) {
            try {
                const urlObj = new URL(reqToLoad.url.startsWith('http') ? reqToLoad.url : 'http://' + reqToLoad.url);
                reqToLoad.name = urlObj.pathname === '/' ? urlObj.hostname : urlObj.pathname;
            } catch (e) {
                reqToLoad.name = reqToLoad.url || 'History Request';
            }
        }

        // Ensure legacy/malformed requests with body get treated as raw JSON
        if (reqToLoad.body && (reqToLoad.bodyType === 'json' || !reqToLoad.bodyType || reqToLoad.bodyType === 'none')) {
            reqToLoad.bodyType = 'raw';
            reqToLoad.rawType = 'JSON';
        }

        const existingReq = requests.find(r => r.id === reqToLoad.id);
        if (existingReq) {
            // Apply fixes to existing tab if needed
            if (reqToLoad.body && (existingReq.bodyType === 'json' || existingReq.bodyType === 'none')) {
                setRequests(prev => prev.map(r => r.id === reqToLoad.id ? { ...r, bodyType: 'raw', rawType: 'JSON' } : r));
            }
            setActiveRequestId(reqToLoad.id);
        } else {
            const newTab = { ...reqToLoad, response: null, error: null, isLoading: false };
            setRequests(prev => [...prev, newTab]);
            setActiveRequestId(reqToLoad.id);
        }

        if (reqToLoad.body) {
            setActiveTab('body');
        }

        const col = localCollections.find(c => c.requests.find(r => r.id === reqToLoad.id));
        if (col) setActiveCollectionId(col.id);
    };

    const clearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            setHistory([]);
        }
    };

    const handleAddTab = () => {
        const newId = Date.now().toString();
        const newRequest = {
            id: newId,
            name: 'New Request',
            method: 'GET',
            url: '',
            params: [{ key: '', value: '', active: true }],
            headers: [{ key: '', value: '', active: true }],
            bodyType: 'none',
            rawType: 'JSON',
            body: '',
            authType: 'none',
            authData: {},
            response: null,
            error: null,
            isLoading: false
        };
        setRequests(prev => [...prev, newRequest]);
        setActiveRequestId(newId);
    };

    const handleCloseTab = (id) => {
        if (requests.length === 1) return;
        setRequests(prev => {
            const newRequests = prev.filter(r => r.id !== id);
            if (id === activeRequestId) {
                setActiveRequestId(newRequests[newRequests.length - 1].id);
            }
            return newRequests;
        });
    };

    const currentEnv = environments.find(env => env.id === activeEnv);

    const handleGlobalImport = (type, data) => {
        try {
            if (type === 'collection') {
                const parsed = JSON.parse(data);
                let newCol = {
                    id: Date.now().toString(),
                    name: parsed.info?.name || parsed.name || 'Imported Collection',
                    requests: []
                };

                const extractRequests = (items) => {
                    let reqs = [];
                    items.forEach(item => {
                        if (item.item) {
                            reqs = [...reqs, ...extractRequests(item.item)];
                        } else if (item.request) {
                            reqs.push({
                                id: Date.now().toString() + Math.random(),
                                name: item.name,
                                method: item.request.method || 'GET',
                                url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
                                params: [],
                                headers: item.request.header ? item.request.header.reduce((acc, h) => {
                                    acc.push({ key: h.key, value: h.value, active: true });
                                    return acc;
                                }, []) : [],
                                body: item.request.body?.raw || null,
                                bodyType: item.request.body?.raw ? 'raw' : 'none',
                                rawType: 'JSON',
                                authType: 'none',
                                authData: {}
                            });
                        }
                    });
                    return reqs;
                };

                if (parsed.item) {
                    newCol.requests = extractRequests(parsed.item);
                }

                setLocalCollections(prev => [...prev, newCol]);
                window.alert('Collection imported successfully into Local Collections.');

            } else if (type === 'curl') {
                // Robust cURL parsing
                const cleanData = data.replace(/\\\n/g, ' '); // Handle line continuations

                // Extract Method
                const methodMatch = cleanData.match(/-X\s+([A-Z]+)/);
                const method = methodMatch ? methodMatch[1] : (cleanData.includes('-d ') || cleanData.includes('--data') ? 'POST' : 'GET');

                // Extract URL (find the first thing that looks like a URL or starts with {{)
                const urlMatch = cleanData.match(/(?:['"])(http[s]?:\/\/.*?|{{.*?}}.*?)(?:['"])/) || cleanData.match(/\s(http[s]?:\/\/.*?|{{.*?}}.*?)\s/);
                const url = urlMatch ? urlMatch[1] : '';

                // Extract Headers
                const headerMatches = [...cleanData.matchAll(/-H\s+['"](.*?)['"]/g)];
                const headers = headerMatches.reduce((acc, match) => {
                    const firstColon = match[1].indexOf(':');
                    if (firstColon !== -1) {
                        const key = match[1].slice(0, firstColon).trim();
                        const value = match[1].slice(firstColon + 1).trim();
                        acc.push({ key, value, active: true });
                    }
                    return acc;
                }, []);

                // Extract Body (-d or --data)
                // More resilient regex for quoted bodies
                let body = '';
                const bodyMatches = [...cleanData.matchAll(/(?:-d|--data(?:-raw)?)\s+(['"])([\s\S]*?)\1/g)];
                if (bodyMatches.length > 0) {
                    body = bodyMatches.map(m => m[2]).join('&');
                } else {
                    // Try to match unquoted body if quoted fails
                    const unquotedMatch = cleanData.match(/(?:-d|--data(?:-raw)?)\s+([^{"' ]\S*)/);
                    if (unquotedMatch) body = unquotedMatch[1];
                }

                const newId = Date.now().toString();
                const newRequest = {
                    id: newId,
                    name: 'Imported cURL',
                    method: method,
                    url: url,
                    params: [{ key: '', value: '', active: true }],
                    headers: headers.length > 0 ? headers : [{ key: '', value: '', active: true }],
                    bodyType: body ? 'raw' : 'none',
                    rawType: 'JSON',
                    body: body,
                    authType: 'none',
                    authData: {},
                    response: null,
                    error: null,
                    isLoading: false
                };

                setRequests(prev => [...prev, newRequest]);
                setActiveRequestId(newId);
            }
        } catch (e) {
            console.error(e);
            window.alert('Import failed: ' + e.message);
        }
    };

    const handleAddEnvVariable = () => {
        setEnvironments(prev => prev.map(env => {
            if (env.id === activeEnv) {
                return {
                    ...env,
                    variables: [...env.variables, { key: '', value: '', active: true, originalKey: null, originalValue: null }]
                };
            }
            return env;
        }));
    };

    const handleUpdateEnvVariable = (index, field, value) => {
        setEnvironments(prev => prev.map(env => {
            if (env.id === activeEnv) {
                const newVariables = [...env.variables];
                newVariables[index] = { ...newVariables[index], [field]: value };
                return { ...env, variables: newVariables };
            }
            return env;
        }));
    };

    const handleSaveEnvVariable = async (index) => {
        const currentEnv = environments.find(e => e.id === activeEnv);
        if (!currentEnv) return;

        // Find the specific variable being saved
        const targetVariable = currentEnv.variables[index];
        if (!targetVariable) return;

        // Find the project ID
        let targetProjectId = null;
        if (activeAppCodeName && activeModule && rawAppCodes.length > 0) {
            const selectedApp = rawAppCodes.find(app =>
                app.projectName === activeAppCodeName && app.moduleName === activeModule
            );
            if (selectedApp) {
                targetProjectId = selectedApp.projectId || selectedApp.id;
            }
        }

        if (!targetProjectId) {
            setErrorMessage('Could not determine Project ID for this environment variable.');
            return;
        }

        const payload = {
            id: targetVariable.id || null, // If it's a new variable, ID might be null or undefined
            project: {
                id: targetProjectId
            },
            envName: currentEnv.name,
            variableKey: targetVariable.key,
            variableValue: targetVariable.value
        };

        try {
            // Using the new API function
            const responseData = await createUpdateEnvVariable(payload, user.token);

            // On success, update the originalKey/originalValue AND the ID for THIS variable to match current
            setEnvironments(prev => prev.map(env => {
                if (env.id === activeEnv) {
                    const newVariables = [...env.variables];
                    newVariables[index] = {
                        ...newVariables[index],
                        id: responseData?.id || newVariables[index].id, // Update ID so it's treated as existing next time
                        originalKey: targetVariable.key,
                        originalValue: targetVariable.value
                    };
                    return { ...env, variables: newVariables };
                }
                return env;
            }));

            setShowEnvSaveSuccess(true);
            setTimeout(() => setShowEnvSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Failed to save environment variable:', e);
            setErrorMessage('Failed to save environment variable.');
        }
    };

    const handleDeleteEnvVariable = async (index) => {
        const currentEnv = environments.find(e => e.id === activeEnv);
        if (!currentEnv) return;

        const variableToDelete = currentEnv.variables[index];
        if (!variableToDelete) return;

        if (!window.confirm('Are you sure you want to delete this variable? This action is immediate.')) return;

        // Optimistically update UI
        const newVariables = currentEnv.variables.filter((_, i) => i !== index);
        setEnvironments(prev => prev.map(env =>
            env.id === activeEnv ? { ...env, variables: newVariables } : env
        ));

        // If the variable exists on server (has ID), delete it via API
        if (variableToDelete.id) {
            try {
                await deleteVariable(variableToDelete.id, user.token);

                // Success notification
                setShowEnvSaveSuccess(true);
                setTimeout(() => setShowEnvSaveSuccess(false), 2000);
            } catch (e) {
                console.error('Failed to delete environment variable:', e);
                setErrorMessage('Failed to delete environment variable. refreshing...');
                // Revert UI if needed, or better, refresh from server
                fetchEnvironments(activeAppCodeName, activeModule);
            }
        }
    };

    const handleRenameEnv = async (envId, newName, oldName) => {
        const currentEnv = environments.find(e => e.id === envId);
        if (!currentEnv) return;

        // Find the project ID
        let targetProjectId = null;
        if (activeAppCodeName && activeModule && rawAppCodes.length > 0) {
            const selectedApp = rawAppCodes.find(app =>
                (app.projectName === activeAppCodeName || app.appCode === activeAppCodeName) && app.moduleName === activeModule
            );
            if (selectedApp) {
                targetProjectId = selectedApp.projectId || selectedApp.id;
            }
        }

        if (!targetProjectId) {
            setErrorMessage('Could not determine Project ID for renaming environment.');
            return;
        }

        try {
            await renameEnv(targetProjectId, oldName || currentEnv.name, newName, user.token);

            // Update local state
            setEnvironments(prev => prev.map(env =>
                env.id === envId ? { ...env, name: newName } : env
            ));

            setShowEnvSaveSuccess(true);
            setTimeout(() => setShowEnvSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Failed to rename environment:', e);
            setErrorMessage('Failed to rename environment.');
            // Revert name in UI if needed (though we updated it optimistically via updateEnvName in child, we might want to reload)
            fetchEnvironments(activeAppCodeName, activeModule);
        }
    };

    const handleDeleteEnv = async (envId, envName) => {
        if (!window.confirm(`Are you sure you want to delete environment "${envName}"?`)) {
            return;
        }

        console.log("handleDeleteEnv Debug:", { activeAppCodeName, activeModule, rawAppCodesLength: rawAppCodes.length });

        // Find the project ID (reusing logic from rename)
        let targetProjectId = null;
        if (activeAppCodeName && activeModule && rawAppCodes.length > 0) {
            const selectedApp = rawAppCodes.find(app =>
                (app.projectName === activeAppCodeName || app.appCode === activeAppCodeName) && app.moduleName === activeModule
            );
            console.log("handleDeleteEnv selectedApp:", selectedApp);
            if (selectedApp) {
                targetProjectId = selectedApp.projectId || selectedApp.id;
            }
        }

        if (!targetProjectId) {
            setErrorMessage('Could not determine Project ID for deleting environment.');
            return;
        }

        try {
            console.log("Calling deleteEnvDetails with:", { targetProjectId, envName });
            await deleteEnvDetails(targetProjectId, envName, user.token);

            // Update local state
            setEnvironments(prev => prev.filter(env => env.id !== envId));
            if (activeEnv === envId) {
                setActiveEnv(null);
            }

            setShowEnvSaveSuccess(true);
            setTimeout(() => setShowEnvSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Failed to delete environment:', e);
            setErrorMessage('Failed to delete environment.');
            fetchEnvironments(activeAppCodeName, activeModule);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-[var(--bg-primary)] text-slate-900 dark:text-[var(--text-primary)] font-sans overflow-hidden">
            <Header
                user={user}
                onLogout={handleLogout}
                theme={theme}
                setTheme={setTheme}
                activeView={activeView}
                setActiveView={setActiveView}
                profilePic={profilePic}
            />

            {errorMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setErrorMessage('')}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 w-[400px] shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Action Required</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                {errorMessage}
                            </p>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SaveRequestModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSaveRequest}
                collections={localCollections}
            />

            <ImportModal
                isOpen={showImportCurlModal} // Reusing the state name to minimize changes, or I should rename state too? Let's just use it.
                onClose={() => setShowImportCurlModal(false)}
                onImport={handleGlobalImport}
            />

            <Layout activeView={activeView} setActiveView={setActiveView} onRefresh={handleRefreshView}>
                {(activeView === 'editData' || activeView === 'appcodes') ? (
                    <EditDataPanel refreshTrigger={editDataRefreshTrigger} />
                ) : activeView === 'environments' ? (
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-80 border-r border-slate-200 dark:border-[var(--border-color)] p-6 overflow-auto bg-white dark:bg-[var(--bg-secondary)]">
                            <EnvironmentManager
                                environments={environments}
                                setEnvironments={setEnvironments}
                                activeEnv={activeEnv}
                                setActiveEnv={setActiveEnv}
                                projects={projects}
                                activeAppCode={activeAppCodeName}
                                onAppCodeSelect={setActiveAppCodeName}
                                onRefreshAppCode={refreshAppCode}
                                modules={modules}
                                activeModule={activeModule}
                                onModuleSelect={setActiveModule}
                                onRefreshModule={refreshModule}
                                onRenameEnv={handleRenameEnv}
                                onDeleteEnv={handleDeleteEnv}
                            />
                        </div>
                        <div className="flex-1 p-8 overflow-auto bg-slate-50 dark:bg-[var(--bg-primary)]">
                            {activeEnv ? (
                                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-[var(--text-primary)]">
                                                {environments.find(e => e.id === activeEnv)?.name}
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">Environment variables are used to store and reuse values in your requests.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200 dark:border-[var(--border-color)] shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 dark:border-[var(--border-color)] bg-slate-50/50 dark:bg-white/5">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-[var(--text-secondary)]">Variables</span>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex flex-col border border-slate-200 dark:border-[var(--border-color)] rounded-lg overflow-hidden bg-white dark:bg-[var(--bg-surface)]">
                                                <div className="flex border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <div className="flex-1 p-2 border-r border-slate-200 dark:border-[var(--border-color)]">Key</div>
                                                    <div className="flex-1 p-2 border-r border-slate-200 dark:border-[var(--border-color)]">Value</div>
                                                    <div className="w-16 p-2 text-center text-[10px] uppercase">Actions</div>
                                                </div>
                                                {(environments.find(e => e.id === activeEnv)?.variables || []).map((pair, index) => {
                                                    const isModified = pair.key !== pair.originalKey || pair.value !== pair.originalValue;
                                                    return (
                                                        <div key={index} className="flex border-b border-slate-200 dark:border-[var(--border-color)] last:border-0 group">
                                                            <input
                                                                className="flex-1 bg-transparent p-2 text-sm outline-none border-r border-slate-200 dark:border-[var(--border-color)] placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-slate-900 dark:text-[var(--text-primary)]"
                                                                placeholder="Key"
                                                                value={pair.key}
                                                                onChange={(e) => handleUpdateEnvVariable(index, 'key', e.target.value)}
                                                            />
                                                            <input
                                                                className="flex-1 bg-transparent p-2 text-sm outline-none border-r border-slate-200 dark:border-[var(--border-color)] placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-slate-900 dark:text-[var(--text-primary)]"
                                                                placeholder="Value"
                                                                value={pair.value}
                                                                onChange={(e) => handleUpdateEnvVariable(index, 'value', e.target.value)}
                                                            />
                                                            <div className="w-16 flex items-center justify-center gap-1 bg-slate-50/50 dark:bg-white/5">
                                                                <button
                                                                    disabled={!isModified}
                                                                    onClick={() => handleSaveEnvVariable(index)}
                                                                    className={cn(
                                                                        "p-1 rounded transition-all",
                                                                        isModified
                                                                            ? "text-green-600 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                                            : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                                                    )}
                                                                    title={isModified ? "Save changes" : "No changes to save"}
                                                                >
                                                                    <Save className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEnvVariable(index)}
                                                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                    title="Delete Variable"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    onClick={handleAddEnvVariable}
                                                    className="flex items-center gap-2 p-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" /> Add new variable
                                                </button>
                                            </div>

                                            {showEnvSaveSuccess && (
                                                <div className="flex justify-center">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                        <Check className="w-3 h-3" />
                                                        Changes saved successfully
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-[var(--text-secondary)] gap-4">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                                        <Globe className="w-8 h-8 opacity-20 text-red-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">No Environment Selected</p>
                                        <p className="text-sm">Select an environment from the list to configure its variables.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeView === 'settings' ? (
                    <Settings
                        user={user}
                        theme={theme}
                        setTheme={setTheme}
                        layout={layout}
                        setLayout={setLayout}
                        profilePic={profilePic}
                        setProfilePic={setProfilePic}
                        onLogout={handleLogout}
                        localCollectionsPath={localCollectionsPath}
                        setLocalCollectionsPath={setLocalCollectionsPath}
                    />
                ) : (activeView === 'history' && history.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[var(--bg-primary)] h-full overflow-hidden">
                        <div className="flex flex-col items-center max-w-sm text-center p-12 -mt-20">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-sm">
                                <Clock className="w-10 h-10 text-slate-400 dark:text-slate-500 -rotate-12" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Empty History</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                                Every request you send will be logged here for quick access later. It's looking a bit lonely right now!
                            </p>
                            <button
                                onClick={() => setActiveView('collections')}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Start Sending Requests
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center bg-slate-100 dark:bg-[var(--bg-secondary)] border-b border-slate-200 dark:border-[var(--border-color)]">
                            <div className="flex-1 overflow-hidden">
                                <RequestTabs
                                    requests={requests}
                                    activeRequestId={activeRequestId}
                                    onActivate={setActiveRequestId}
                                    onClose={handleCloseTab}
                                    onAdd={handleAddTab}
                                />
                            </div>

                            <div className="flex items-center px-4 gap-2">
                                <button
                                    onClick={saveToCollection}
                                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
                                    title="Save to collection"
                                >
                                    <Save className="w-3 h-3" /> Save
                                </button>
                            </div>
                        </div>

                        <RequestBar
                            method={activeRequest.method}
                            setMethod={(val) => updateActiveRequest({ method: val })}
                            url={activeRequest.url}
                            setUrl={(val) => updateActiveRequest({ url: val })}
                            onSend={handleSend}
                            isLoading={activeRequest.isLoading}
                        />

                        <div className="flex-1 flex overflow-hidden">
                            {activeView === 'history' && (
                                <div className="w-80 border-r border-slate-200 dark:border-[var(--border-color)]">
                                    <HistoryPanel
                                        history={history}
                                        onLoadRequest={loadRequest}
                                        onClearHistory={clearHistory}
                                    />
                                </div>
                            )}

                            {activeView === 'collections' && (
                                <CollectionsPanel
                                    localCollections={localCollections}
                                    setLocalCollections={setLocalCollections}
                                    serverCollections={serverCollections}
                                    onLoadRequest={loadRequest}
                                    width={collectionsPanelWidth}
                                    onWidthChange={setCollectionsPanelWidth}
                                    onSaveCollection={saveCollectionToDb}
                                    onReloadCollection={reloadCollectionFromDb}
                                    projects={projects}
                                    activeAppCode={activeAppCodeName}
                                    onAppCodeSelect={setActiveAppCodeName}
                                    onRefreshAppCode={refreshAppCode}
                                    modules={modules}
                                    activeModule={activeModule}
                                    onModuleSelect={setActiveModule}
                                    onRefreshModule={refreshModule}
                                    activeCollectionId={activeCollectionId}
                                    onImportCurl={() => setShowImportCurlModal(true)}
                                    environments={environments}
                                    activeEnv={activeEnv}
                                    onEnvSelect={setActiveEnv}
                                />
                            )}

                            <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} min-w-0 overflow-hidden`}>
                                <div
                                    className={`flex flex-col min-w-0 ${layout === 'vertical' ? 'w-full' : 'h-full'}`}
                                    style={layout === 'vertical' ? { height: requestPanelHeight } : { width: requestPanelWidth }}
                                >
                                    <div className="flex-1 border-r border-slate-200 dark:border-[var(--border-color)] p-2.5 flex flex-col min-h-0 overflow-auto">
                                        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                                        <div className="flex-1 overflow-auto mt-2">
                                            {activeTab === 'docs' && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                                                    <AlignLeft className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-sm font-medium">Documentation</p>
                                                    <p className="text-xs mt-1">Add documentation for this request to help your team.</p>
                                                </div>
                                            )}
                                            {activeTab === 'params' && (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Query Parameters</p>
                                                    <KeyValueEditor pairs={activeRequest.params} setPairs={(val) => updateActiveRequest({ params: val })} />
                                                </div>
                                            )}
                                            {activeTab === 'headers' && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Headers</p>
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Auto-generated headers hidden</span>
                                                    </div>
                                                    <KeyValueEditor pairs={activeRequest.headers} setPairs={(val) => updateActiveRequest({ headers: val })} />
                                                </div>
                                            )}
                                            {activeTab === 'body' && (
                                                <BodyEditor
                                                    bodyType={activeRequest.bodyType}
                                                    setBodyType={(val) => updateActiveRequest({ bodyType: val })}
                                                    body={activeRequest.body}
                                                    setBody={(val) => updateActiveRequest({ body: val })}
                                                    rawType={activeRequest.rawType || 'JSON'}
                                                    setRawType={(val) => updateActiveRequest({ rawType: val })}
                                                />
                                            )}
                                            {activeTab === 'auth' && (
                                                <AuthEditor
                                                    authType={activeRequest.authType}
                                                    setAuthType={(val) => updateActiveRequest({ authType: val })}
                                                    authData={activeRequest.authData}
                                                    setAuthData={(val) => updateActiveRequest({ authData: val })}
                                                />
                                            )}
                                            {activeTab === 'scripts' && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                                                    <Code2 className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-sm font-medium">Pre-request Scripts</p>
                                                    <p className="text-xs mt-1">Write scripts to execute before the request is sent.</p>
                                                </div>
                                            )}
                                            {activeTab === 'tests' && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                                                    <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-sm font-medium">Test Scripts</p>
                                                    <p className="text-xs mt-1">Write tests to validate the response data.</p>
                                                </div>
                                            )}
                                            {activeTab === 'settings' && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                                                    <SettingsIcon className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-sm font-medium">Request Settings</p>
                                                    <p className="text-xs mt-1">Configure timeouts, SSL verification, and other settings.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`${layout === 'vertical' ? 'h-px hover:h-1 cursor-row-resize w-full' : 'w-px hover:w-1 cursor-col-resize h-full'} bg-slate-200 dark:bg-[var(--border-color)] hover:bg-red-500 transition-all flex items-center justify-center group z-10`}
                                    onMouseDown={() => setIsResizingRequest(true)}
                                >
                                </div>

                                <div className="flex-1 p-2.5 bg-slate-50 dark:bg-[var(--bg-primary)] flex flex-col min-w-0 min-h-0 overflow-hidden">
                                    <h2 className="text-slate-500 font-semibold mb-2 text-sm uppercase tracking-wider">Response</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponseViewer
                                            response={activeRequest.response}
                                            error={activeRequest.error}
                                            isLoading={activeRequest.isLoading}
                                            activeRequest={activeRequest}
                                            theme={theme}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Layout>

            {
                showConsole && (
                    <div
                        className="border-t border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-primary)] flex flex-col"
                        style={{ height: consoleHeight }}
                    >
                        {/* Resize handle */}
                        <div
                            className="h-1 hover:h-1.5 cursor-row-resize w-full bg-slate-200 dark:border-[var(--border-color)] hover:bg-red-500 transition-all flex items-center justify-center group z-50 -mt-0.5"
                            onMouseDown={() => setIsResizingConsole(true)}
                        >
                        </div>
                        <div className="flex items-center justify-between px-3 py-1 border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-secondary)]">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Console</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setHistory([])} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Clear Console">
                                    Clear
                                </button>
                                <button onClick={() => setShowConsole(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-0 font-mono text-xs">
                            {history.length === 0 ? (
                                <div className="p-4 text-slate-400 dark:text-slate-600 italic">No console logs</div>
                            ) : (
                                history.map((item, i) => (
                                    <ConsoleItem key={i} item={item} isLatest={i === 0} />
                                ))
                            )}
                        </div>
                    </div>
                )
            }

            <Footer
                showConsole={showConsole}
                onToggleConsole={() => setShowConsole(!showConsole)}
                latestRequest={latestRequest}
            />
        </div >
    );
}
