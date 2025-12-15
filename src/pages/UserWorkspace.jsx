import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiService } from '../services/api';
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
import { X, Save, Moon, Sun } from 'lucide-react';
import { cn, replaceEnvVariables } from '../lib/utils';
import { SaveRequestModal } from '../components/SaveRequestModal';
import { Header } from '../components/Header';
import { Settings } from '../components/Settings';
import { ImportModal } from '../components/ImportModal';
import { EditDataPanel } from '../components/EditDataModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

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
        body: '',
        authType: 'none',
        authData: {},
        response: null,
        error: null,
        isLoading: false
    }]);
    const [activeRequestId, setActiveRequestId] = useState('default');

    // Derived active request
    const activeRequest = requests.find(r => r.id === activeRequestId) || requests[0];

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings popup

    // Layout state
    const [collectionsPanelWidth, setCollectionsPanelWidth] = useState(280);
    const [requestPanelHeight, setRequestPanelHeight] = useState(400); // For vertical split
    const [requestPanelWidth, setRequestPanelWidth] = useState(500); // For horizontal split
    const [isResizingRequest, setIsResizingRequest] = useState(false);

    // Project state
    const placeholderProjects = [{ id: 'default', name: 'Default Project' }];
    const [projects, setProjects] = useState(placeholderProjects);
    const [activeProject, setActiveProject] = useState('default');

    const [rawAppCodes, setRawAppCodes] = useState([]);
    const [activeModule, setActiveModule] = useState('default');
    const [modules, setModules] = useState([]);

    // Fetch collections when module changes
    useEffect(() => {
        if (activeProject && activeModule && rawAppCodes.length > 0) {
            // Find the app code object that matches the active project and module
            const selectedApp = rawAppCodes.find(app =>
                app.projectName === activeProject && app.moduleName === activeModule
            );

            if (selectedApp && selectedApp.projectId) {
                fetchServerCollections(selectedApp.projectId);
            } else {
                console.warn('Project ID not found for selection:', activeProject, activeModule);
                setServerCollections([]);
            }
        }
    }, [activeProject, activeModule, rawAppCodes]);

    const fetchServerCollections = async (projectId) => {
        try {
            console.log(`Fetching collections for Project ID: ${projectId}`);
            const fetchedCollections = await apiService.getCollectionsByProjectId(projectId);

            if (fetchedCollections && Array.isArray(fetchedCollections)) {
                const mappedCollections = fetchedCollections.map(col => ({
                    id: col.collectionId ? col.collectionId.toString() : Date.now().toString(),
                    name: col.name,
                    requests: col.requests ? col.requests.map(req => {
                        return {
                            id: req.requestId ? req.requestId.toString() : Date.now().toString(),
                            name: req.name,
                            method: req.method,
                            url: req.url,
                            params: [], // Initialize if not provided by API
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
                            bodyType: req.body ? 'json' : 'none',
                            authType: 'none',
                            authData: {}
                        };
                    }) : []
                }));

                setServerCollections(mappedCollections);
            } else {
                setServerCollections([]);
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
        }
    };

    const refreshModule = () => {
        if (activeProject && activeModule && rawAppCodes.length > 0) {
            const selectedApp = rawAppCodes.find(app =>
                app.projectName === activeProject && app.moduleName === activeModule
            );
            if (selectedApp && selectedApp.projectId) {
                fetchServerCollections(selectedApp.projectId);
            }
        }
    };

    // Update modules when activeProject (projectName) changes
    useEffect(() => {
        if (activeProject && rawAppCodes.length > 0) {
            const projectAppCodes = rawAppCodes.filter(app => app.projectName === activeProject);
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
    }, [activeProject, rawAppCodes]);

    // Collections & Environments
    const [serverCollections, setServerCollections] = useState([]);
    const [localCollections, setLocalCollections] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [activeEnv, setActiveEnv] = useState(null);
    const [history, setHistory] = useState([]);

    // Load from localStorage
    useEffect(() => {
        const savedCollections = localStorage.getItem('collections');
        const savedEnvironments = localStorage.getItem('environments');
        const savedLayout = localStorage.getItem('layout');
        if (savedCollections) setLocalCollections(JSON.parse(savedCollections));
        if (savedEnvironments) setEnvironments(JSON.parse(savedEnvironments));
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
    const latestRequest = history.length > 0 ? history[history.length - 1] : null;

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

    // INITIALIZATION: Fetch projects for the logged-in user
    useEffect(() => {
        const initWorkspace = async () => {
            // Use user.assignedAppCodes if available (from mock Login)
            // OR fetch from server if dynamic
            if (user) {
                if (user.assignedAppCodes && user.assignedAppCodes.length > 0) {
                    setRawAppCodes(user.assignedAppCodes);
                    // Extract unique projects
                    const uniqueProjects = [...new Set(user.assignedAppCodes.map(app => app.projectName))]
                        .map(name => ({ id: name, name: name }));

                    if (uniqueProjects.length > 0) {
                        setProjects(uniqueProjects);
                        setActiveProject(uniqueProjects[0].id);
                    }
                } else {
                    // Fallback: Fetch all public projects if no specific assignments (legacy behavior or admin)
                    // OR if user.role is admin, fetch all
                    if (user.role === 'admin' || !user.assignedAppCodes) {
                        try {
                            const fetchedData = await apiService.getAllProjects();
                            if (fetchedData && Array.isArray(fetchedData)) {
                                setRawAppCodes(fetchedData);
                                const uniqueProjects = [...new Set(fetchedData.map(app => app.projectName))]
                                    .map(name => ({ id: name, name: name }));
                                if (uniqueProjects.length > 0) {
                                    setProjects(uniqueProjects);
                                    setActiveProject(uniqueProjects[0].id);
                                }
                            }
                        } catch (e) { console.error(e); }
                    }
                }
            }
        };
        initWorkspace();
    }, [user]);


    const tabs = [
        { id: 'params', label: 'Params' },
        { id: 'headers', label: 'Headers' },
        { id: 'body', label: 'Body' },
        { id: 'auth', label: 'Auth' },
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

        try {
            const currentEnv = environments.find(env => env.id === activeEnv);
            processedUrl = replaceEnvVariables(request.url, currentEnv);
            const paramsObj = request.params.reduce((acc, curr) => {
                if (curr.key && curr.active) acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
                return acc;
            }, {});
            const headersObj = request.headers.reduce((acc, curr) => {
                if (curr.key && curr.active) acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
                return acc;
            }, {});
            applyAuth(headersObj, paramsObj, request);

            const config = {
                method: request.method,
                url: processedUrl,
                params: paramsObj,
                headers: headersObj,
            };

            if (request.bodyType !== 'none' && request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
                if (request.bodyType === 'json') {
                    config.data = JSON.parse(request.body);
                    headersObj['Content-Type'] = 'application/json';
                } else {
                    config.data = request.body;
                }
            }

            const proxyRes = await axios({
                method: 'POST',
                url: 'http://localhost:3001/proxy',
                data: {
                    method: config.method,
                    url: config.url,
                    headers: config.headers,
                    data: config.data
                }
            });
            const res = proxyRes.data;
            if (res.isError) {
                throw {
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
                method: request.method,
                url: processedUrl,
                status: res.status,
                timestamp: new Date().toLocaleString(),
                params: request.params,
                headers: request.headers,
                bodyType: request.bodyType,
                body: request.body,
                authType: request.authType,
                authData: request.authData,
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
            if (err.response) {
                const historyEntry = {
                    method: request.method,
                    url: processedUrl,
                    status: err.response.status,
                    timestamp: new Date().toLocaleString(),
                    params: request.params,
                    headers: request.headers,
                    bodyType: request.bodyType,
                    body: request.body,
                    authType: request.authType,
                    authData: request.authData,
                };
                setHistory(prev => [historyEntry, ...prev].slice(0, 50));
            }
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

    const refreshProject = async () => {
        if (user && user.assignedAppCodes) return; // Don't refresh if hardcoded assignments
        try {
            const fetchedData = await apiService.getAllProjects();
            if (fetchedData && Array.isArray(fetchedData)) {
                setRawAppCodes(fetchedData);
                const uniqueProjects = [...new Set(fetchedData.map(app => app.projectName))]
                    .map(name => ({ id: name, name: name }));
                if (uniqueProjects.length > 0) {
                    setProjects(uniqueProjects);
                    if (!uniqueProjects.find(p => p.id === activeProject)) {
                        setActiveProject(uniqueProjects[0].id);
                    }
                }
            }
        } catch (error) { }
    };

    const saveToCollection = () => {
        if (localCollections.length === 0) {
            window.alert('Please create a collection first before saving requests.');
            return;
        }
        if (activeRequest.id && activeCollectionId) {
            handleSaveRequest(null, activeCollectionId, true);
        } else {
            setShowSaveModal(true);
        }
    };

    const handleSaveRequest = (requestName, collectionId, isOverwrite = false) => {
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
                                body: activeRequest.body,
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
                        body: activeRequest.body,
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
        const existingReq = requests.find(r => r.id === request.id);
        if (existingReq) {
            setActiveRequestId(request.id);
        } else {
            const newTab = { ...request, response: null, error: null, isLoading: false };
            setRequests(prev => [...prev, newTab]);
            setActiveRequestId(request.id);
        }
        const col = localCollections.find(c => c.requests.find(r => r.id === request.id));
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
                                bodyType: item.request.body?.raw ? 'json' : 'none',
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
                // Keep the previous simple curl logic but improved if needed, or stick to provided parsing?
                // The previous component parsed it passed as an object. The new ImportModal passes raw string.
                // We need to parse the raw string here if the ImportModal passes raw string.
                // Wait, ImportModal passes the raw text. So we need parsing logic here.

                // Simplified cURL parsing (similar to EditDataModal)
                const methodMatch = data.match(/-X\s+([A-Z]+)/);
                const urlMatch = data.match(/['"](http.*?)['"]/);
                const headerMatches = [...data.matchAll(/-H\s+['"](.*?)['"]/g)];
                const dataMatch = data.match(/--data\s+['"](.*?)['"]/);

                const newId = Date.now().toString();
                const newRequest = {
                    id: newId,
                    name: 'Imported cURL',
                    method: methodMatch ? methodMatch[1] : 'GET',
                    url: urlMatch ? urlMatch[1] : '',
                    params: [{ key: '', value: '', active: true }],
                    headers: headerMatches.reduce((acc, match) => {
                        const [key, val] = match[1].split(':').map(s => s.trim());
                        if (key && val) acc.push({ key, value: val, active: true });
                        return acc;
                    }, []),
                    bodyType: dataMatch ? 'json' : 'none',
                    body: dataMatch ? dataMatch[1] : '',
                    authType: 'none',
                    authData: {},
                    response: null,
                    error: null,
                    isLoading: false
                };

                // Add to session requests
                setRequests(prev => [...prev, newRequest]);
                setActiveRequestId(newId);

                // Option: Add to a local 'Imports' collection?
                // For now, loading into workspace active tabs is standard for cURL.
            }
        } catch (e) {
            console.error(e);
            window.alert('Import failed: ' + e.message);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-[var(--bg-primary)] text-slate-900 dark:text-[var(--text-primary)] font-sans overflow-hidden">
            <Header
                user={user}
                onLogout={() => { logout(); navigate('/login'); }}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                theme={theme}
                setTheme={setTheme}
                activeView={activeView}
                setActiveView={setActiveView}
            />



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

            <Layout activeView={activeView} setActiveView={setActiveView}>
                {activeView === 'editData' ? (
                    <EditDataPanel />
                ) : activeView === 'environments' ? (
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-96 border-r border-slate-200 dark:border-slate-800 p-6 overflow-auto">
                            <EnvironmentManager
                                environments={environments}
                                setEnvironments={setEnvironments}
                                activeEnv={activeEnv}
                                setActiveEnv={setActiveEnv}
                            />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <p className="text-sm">Select an environment to configure variables</p>
                        </div>
                    </div>
                ) : activeView === 'settings' ? (
                    <Settings theme={theme} setTheme={setTheme} layout={layout} setLayout={setLayout} />
                ) : (
                    <>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-secondary)]">
                            <div className="flex items-center gap-2">
                                {activeEnv && (
                                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                                        {environments.find(e => e.id === activeEnv)?.name}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={saveToCollection}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                                title="Save to collection"
                            >
                                <Save className="w-3 h-3" /> Save
                            </button>
                        </div>

                        <RequestTabs
                            requests={requests}
                            activeRequestId={activeRequestId}
                            onActivate={setActiveRequestId}
                            onClose={handleCloseTab}
                            onAdd={handleAddTab}
                        />

                        <RequestBar
                            method={activeRequest.method}
                            setMethod={(val) => updateActiveRequest({ method: val })}
                            url={activeRequest.url}
                            setUrl={(val) => updateActiveRequest({ url: val })}
                            onSend={handleSend}
                            isLoading={activeRequest.isLoading}
                        />

                        <div className="flex-1 flex overflow-hidden">
                            {activeView === 'history' && history.length > 0 && (
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
                                    activeProject={activeProject}
                                    onProjectSelect={setActiveProject}
                                    onRefreshProject={refreshProject}
                                    modules={modules}
                                    activeModule={activeModule}
                                    onModuleSelect={setActiveModule}
                                    onRefreshModule={refreshModule}
                                    activeCollectionId={activeCollectionId}
                                    onImportCurl={() => setShowImportCurlModal(true)}
                                />
                            )}

                            <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} min-w-0 overflow-hidden`}>
                                <div
                                    className={`flex flex-col min-w-0 ${layout === 'vertical' ? 'w-full' : 'h-full'}`}
                                    style={layout === 'vertical' ? { height: requestPanelHeight } : { width: requestPanelWidth }}
                                >
                                    <div className="flex-1 border-r border-slate-200 dark:border-[var(--border-color)] p-4 flex flex-col min-h-0 overflow-auto">
                                        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                                        <div className="flex-1 overflow-auto mt-2">
                                            {activeTab === 'params' && (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-slate-500 mb-2">Query Parameters</p>
                                                    <KeyValueEditor pairs={activeRequest.params} setPairs={(val) => updateActiveRequest({ params: val })} />
                                                </div>
                                            )}
                                            {activeTab === 'headers' && (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-slate-500 mb-2">Request Headers</p>
                                                    <KeyValueEditor pairs={activeRequest.headers} setPairs={(val) => updateActiveRequest({ headers: val })} />
                                                </div>
                                            )}
                                            {activeTab === 'body' && (
                                                <BodyEditor
                                                    bodyType={activeRequest.bodyType}
                                                    setBodyType={(val) => updateActiveRequest({ bodyType: val })}
                                                    body={activeRequest.body}
                                                    setBody={(val) => updateActiveRequest({ body: val })}
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
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`${layout === 'vertical' ? 'h-1 hover:h-1.5 cursor-row-resize w-full' : 'w-1 hover:w-1.5 cursor-col-resize h-full'} bg-slate-200 dark:bg-[var(--border-color)] hover:bg-red-500 transition-all flex items-center justify-center group z-10`}
                                    onMouseDown={() => setIsResizingRequest(true)}
                                >
                                </div>

                                <div className="flex-1 p-4 bg-slate-50 dark:bg-[var(--bg-primary)] flex flex-col min-w-0 min-h-0 overflow-hidden">
                                    <h2 className="text-slate-500 font-semibold mb-4 text-sm uppercase tracking-wider">Response</h2>
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
                    <div className="h-48 border-t border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-primary)] flex flex-col">
                        <div className="flex items-center justify-between px-3 py-1 border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-secondary)]">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Console</span>
                            <button onClick={() => setShowConsole(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 font-mono text-xs">
                            {history.length === 0 ? (
                                <div className="text-slate-400 dark:text-slate-600 italic">No console logs</div>
                            ) : (
                                [...history].reverse().map((item, i) => (
                                    <div key={i} className={cn("flex gap-2 py-0.5", i === 0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                                        <span className="w-16">{item.timestamp.split(' ')[1]}</span>
                                        <span className={cn(
                                            "w-12 uppercase",
                                            item.method === 'GET' && "text-green-600 dark:text-green-500",
                                            item.method === 'POST' && "text-yellow-600 dark:text-yellow-500",
                                            item.method === 'PUT' && "text-blue-600 dark:text-blue-500",
                                            item.method === 'DELETE' && "text-red-600 dark:text-red-500"
                                        )}>{item.method}</span>
                                        <span className="flex-1 truncate">{item.url}</span>
                                        <span className={cn(
                                            item.status >= 200 && item.status < 300 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                                        )}>{item.status}</span>
                                        <span className="text-slate-400">{item.time}ms</span>
                                    </div>
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
