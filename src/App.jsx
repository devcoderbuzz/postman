import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiService } from './services/api';
import { Layout } from './components/Layout';
import { RequestBar } from './components/RequestBar';
import { Tabs } from './components/Tabs';
import { KeyValueEditor } from './components/KeyValueEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { BodyEditor } from './components/BodyEditor';
import { AuthEditor } from './components/AuthEditor';
import { CollectionsPanel } from './components/CollectionsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { EnvironmentManager } from './components/EnvironmentManager';
import { RequestTabs } from './components/RequestTabs';

import { replaceEnvVariables } from './lib/utils';
import { SaveRequestModal } from './components/SaveRequestModal';
import { Save, Moon, Sun, GripVertical } from 'lucide-react';
import { Header } from './components/Header';
import { Settings } from './components/Settings';

function App() {
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
  const [activeView, setActiveView] = useState('history');
  const [theme, setTheme] = useState('dark');
  const [layout, setLayout] = useState('horizontal'); // 'vertical' or 'horizontal'
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Layout state
  const [collectionsPanelWidth, setCollectionsPanelWidth] = useState(280);
  const [requestPanelHeight, setRequestPanelHeight] = useState(400); // For vertical split
  const [requestPanelWidth, setRequestPanelWidth] = useState(500); // For horizontal split
  const [isResizingRequest, setIsResizingRequest] = useState(false);

  // Project state
  const placeholderProjects = [{ id: 'default', name: 'Default Project' }];
  const [projects, setProjects] = useState(placeholderProjects);
  const [activeProject, setActiveProject] = useState('default');

  // Collections & Environments
  const [collections, setCollections] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [activeEnv, setActiveEnv] = useState(null);
  const [history, setHistory] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const savedCollections = localStorage.getItem('collections');
    const savedEnvironments = localStorage.getItem('environments');
    const savedLayout = localStorage.getItem('layout');
    if (savedCollections) setCollections(JSON.parse(savedCollections));
    if (savedEnvironments) setEnvironments(JSON.parse(savedEnvironments));
    if (savedLayout) setLayout(savedLayout);
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem('layout', layout);
  }, [layout]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('environments', JSON.stringify(environments));
  }, [environments]);

  // Resize logic for Request/Response split
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRequest) return;

      if (layout === 'vertical') {
        // Calculate height from top of the container (approx 100px offset from window top)
        // A better way is to use flex growing but for manual resize pixel height is easier
        const newHeight = e.clientY - 120; // 120px approx header + tabs
        if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
          setRequestPanelHeight(newHeight);
        }
      } else {
        // Horizontal layout
        const newWidth = e.clientX - collectionsPanelWidth - 60; // Approximate offset
        if (newWidth >= 300 && newWidth <= window.innerWidth - 400) {
          setRequestPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingRequest(false);
    };

    if (isResizingRequest) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingRequest]);



  // Auto-authenticate and fetch projects on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing app auth...');
        const authData = await apiService.authenticate('admin', 'admin');

        if (authData) {
          console.log('Auth successful');
          if (authData.token) {
            sessionStorage.setItem('authToken', authData.token);
          }

          // Fetch projects
          console.log('Fetching projects...');
          const fetchedProjects = await apiService.getAllProjects();
          console.log('Projects fetched:', fetchedProjects);

          if (fetchedProjects && Array.isArray(fetchedProjects)) {
            // Map to expected format if necessary, assuming API returns array of objects with id/name
            // Adjust mapping based on actual API response structure if needed
            // Map to expected format
            const mappedProjects = fetchedProjects.map(p => {
              // Handle if p is just a string
              if (typeof p === 'string') return { id: p, name: p };

              // Handle object
              return {
                id: p.appCode || p.id || p.code || 'unknown-id-' + Math.random(),
                name: p.description || p.name || p.appCode || p.code || 'Unnamed Project'
              };
            });
            console.log('Raw fetched projects:', fetchedProjects);
            console.log('Mapped projects:', mappedProjects);

            if (mappedProjects.length > 0) {
              setProjects(mappedProjects);
              setActiveProject(mappedProjects[0].id);
            }
          }
        }
      } catch (err) {
        console.error('App initialization failed:', err);
      }
    };

    initApp();
  }, []);


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

    // Optimistic UI update

    const startTime = Date.now();
    let processedUrl = request.url;

    try {
      // Get active environment
      const currentEnv = environments.find(env => env.id === activeEnv);

      // Replace environment variables
      processedUrl = replaceEnvVariables(request.url, currentEnv);

      // Convert params/headers arrays to objects
      const paramsObj = request.params.reduce((acc, curr) => {
        if (curr.key && curr.active) {
          acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
        }
        return acc;
      }, {});

      const headersObj = request.headers.reduce((acc, curr) => {
        if (curr.key && curr.active) {
          acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
        }
        return acc;
      }, {});

      // Apply authentication
      applyAuth(headersObj, paramsObj, request);

      // Prepare request config
      const config = {
        method: request.method,
        url: processedUrl,
        params: paramsObj,
        headers: headersObj,
      };

      // Add body if needed
      if (request.bodyType !== 'none' && request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        if (request.bodyType === 'json') {
          config.data = JSON.parse(request.body);
          headersObj['Content-Type'] = 'application/json';
        } else {
          config.data = request.body;
        }
      }

      // Use proxy for all requests to avoid CORS
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

      // The proxy returns the actual response data in its body
      const res = proxyRes.data;

      // Check if the proxy reported an error (non-2xx from target)
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

      // Add to history
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
      setHistory(prev => [historyEntry, ...prev].slice(0, 50)); // Keep last 50
    } catch (err) {
      let errorData = err;
      let responseData = null;

      if (err.response) {
        const endTime = Date.now();
        responseData = {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
          time: endTime - startTime,
          size: JSON.stringify(err.response.data).length,
        };
      }

      updateActiveRequest({ isLoading: false, error: errorData, response: responseData });

      if (err.response) {
        // Add to history even on error
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
    // Mock API call
    console.log('Mock saving collection:', collection);
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Collection saved (mock)');
        resolve(collection);
      }, 500);
    });
  };

  const reloadCollectionFromDb = async (collectionId) => {
    // Mock API call
    console.log('Mock reloading collection:', collectionId);
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Collection reloaded (mock)');
        // In a real app, this would update state from the server
        resolve(collections);
      }, 500);
    });
  };

  const refreshProject = async () => {
    console.log('Refreshing projects...');
    try {
      const fetchedProjects = await apiService.getAllProjects();
      if (fetchedProjects && Array.isArray(fetchedProjects)) {
        const mappedProjects = fetchedProjects.map(p => ({
          id: p.appCode || p.id,
          name: p.description || p.name || p.appCode
        }));

        if (mappedProjects.length > 0) {
          setProjects(mappedProjects);
          // Optional: maintain active project if it still exists, otherwise default to first
          if (!mappedProjects.find(p => p.id === activeProject)) {
            setActiveProject(mappedProjects[0].id);
          }
          console.log('Projects refreshed', mappedProjects);
        }
      }
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  };

  const saveToCollection = () => {
    if (collections.length === 0) {
      window.alert('Please create a collection first before saving requests.');
      return;
    }
    // If we are editing an existing request, save directly
    if (activeRequest.id && activeCollectionId) {
      handleSaveRequest(null, activeCollectionId, true);
    } else {
      setShowSaveModal(true);
    }
  };

  const handleSaveRequest = (requestName, collectionId, isOverwrite = false) => {
    const updatedCollections = collections.map(col => {
      if (col.id === collectionId) {
        let updatedRequests;
        if (isOverwrite && activeRequestId) {
          updatedRequests = col.requests.map(req => {
            if (req.id === activeRequestId) {
              return {
                ...req,
                name: req.name || requestName, // Keep existing name if overwriting
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

          // Update current active request with new ID and name
          updateActiveRequest({ id: newRequest.id, name: requestName });
          setActiveRequestId(newRequest.id);
          setActiveCollectionId(collectionId);
        }
        const updatedCol = { ...col, requests: updatedRequests };
        saveCollectionToDb(updatedCol); // Save to DB
        return updatedCol;
      }
      return col;
    });
    setCollections(updatedCollections);
  };

  const loadRequest = (request) => {
    // Check if request is already open
    const existingReq = requests.find(r => r.id === request.id);
    if (existingReq) {
      setActiveRequestId(request.id);
    } else {
      // Add as new tab
      const newTab = {
        ...request,
        response: null,
        error: null,
        isLoading: false
      };
      setRequests(prev => [...prev, newTab]);
      setActiveRequestId(request.id);
    }

    // Find collection for this request
    const col = collections.find(c => c.requests.find(r => r.id === request.id));
    if (col) setActiveCollectionId(col.id);

    setActiveView('history'); // Switch back to main view
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  // Tab Management
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
    if (requests.length === 1) return; // Don't close last tab

    setRequests(prev => {
      const newRequests = prev.filter(r => r.id !== id);
      // If we closed the active tab, switch to the last one
      if (id === activeRequestId) {
        setActiveRequestId(newRequests[newRequests.length - 1].id);
      }
      return newRequests;
    });
  };

  // Construct active request for curl view (for ResponseViewer)
  const currentEnv = environments.find(env => env.id === activeEnv);
  //   const activeRequestCurl = {
  //     method: activeRequest.method,
  //     url: replaceEnvVariables(activeRequest.url, currentEnv),
  //     headers: activeRequest.headers.reduce((acc, curr) => {
  //       if (curr.key && curr.active) {
  //         acc[curr.key] = replaceEnvVariables(curr.value, currentEnv);
  //       }
  //       return acc;
  //     }, {}),
  //     body: activeRequest.body,
  //     bodyType: activeRequest.bodyType
  //   };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans overflow-hidden">
      <Header />
      <Layout activeView={activeView} setActiveView={setActiveView}>
        {activeView === 'environments' ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-96 border-r border-neutral-200 dark:border-neutral-800 p-6 overflow-auto">
              <EnvironmentManager
                environments={environments}
                setEnvironments={setEnvironments}
                activeEnv={activeEnv}
                setActiveEnv={setActiveEnv}
              />
            </div>
            <div className="flex-1 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <p className="text-sm">Select an environment to configure variables</p>
            </div>
          </div>
        ) : (activeView === 'settings' ? (
          <Settings theme={theme} setTheme={setTheme} layout={layout} setLayout={setLayout} />
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30">
              <div className="flex items-center gap-2">
                {activeEnv && (
                  <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                    {environments.find(e => e.id === activeEnv)?.name}
                  </span>
                )}
                {/* Theme toggle */}
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme" className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={saveToCollection}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded transition-colors"
                title="Save to collection"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            </div>

            {/* Request Tabs */}
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
              {/* History Panel - shown by default */}
              {activeView === 'history' && history.length > 0 && (
                <div className="w-80 border-r border-neutral-200 dark:border-neutral-800">
                  <HistoryPanel
                    history={history}
                    onLoadRequest={loadRequest}
                    onClearHistory={clearHistory}
                  />
                </div>
              )}

              {/* Collections Sidebar - shown when collections view is active */}
              {activeView === 'collections' && (
                <CollectionsPanel
                  collections={collections}
                  setCollections={setCollections}
                  onLoadRequest={loadRequest}
                  width={collectionsPanelWidth}
                  onWidthChange={setCollectionsPanelWidth}
                  onSaveCollection={saveCollectionToDb}
                  onReloadCollection={reloadCollectionFromDb}
                  projects={projects}
                  activeProject={activeProject}
                  onProjectSelect={setActiveProject}
                  onRefreshProject={refreshProject}
                />
              )}

              {/* Main Content Area (Split Pane) */}
              <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} min-w-0 overflow-hidden`}>

                {/* Request Config Area */}
                <div
                  className={`flex flex-col min-w-0 ${layout === 'vertical' ? 'w-full' : 'h-full'}`}
                  style={layout === 'vertical' ? { height: requestPanelHeight } : { width: requestPanelWidth }}
                >
                  <div className="flex-1 border-r border-neutral-200 dark:border-neutral-800 p-4 flex flex-col min-h-0 overflow-auto">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="flex-1 overflow-auto mt-2">
                      {activeTab === 'params' && (
                        <div className="space-y-4">
                          <p className="text-xs text-neutral-500 mb-2">Query Parameters</p>
                          <KeyValueEditor pairs={activeRequest.params} setPairs={(val) => updateActiveRequest({ params: val })} />
                        </div>
                      )}
                      {activeTab === 'headers' && (
                        <div className="space-y-4">
                          <p className="text-xs text-neutral-500 mb-2">Request Headers</p>
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

                {/* Splitter */}
                <div
                  className={`${layout === 'vertical' ? 'h-1 hover:h-1.5 cursor-row-resize w-full' : 'w-1 hover:w-1.5 cursor-col-resize h-full'} bg-neutral-200 dark:bg-neutral-800 hover:bg-blue-500 transition-all flex items-center justify-center group z-10`}
                  onMouseDown={() => setIsResizingRequest(true)}
                >
                  {/* Optional grip icon */}
                </div>

                {/* Response Area */}
                <div className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-900/30 flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <h2 className="text-neutral-500 font-semibold mb-4 text-sm uppercase tracking-wider">Response</h2>
                  <div className="flex-1 overflow-hidden">
                    <ResponseViewer
                      response={activeRequest.response}
                      error={activeRequest.error}
                      isLoading={activeRequest.isLoading}
                      activeRequest={activeRequest}
                    />
                  </div>
                </div>

              </div>



            </div>
          </>
        ))}
        <SaveRequestModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveRequest}
          collections={collections}
        />
      </Layout >
    </div>
  );
}

export default App;
