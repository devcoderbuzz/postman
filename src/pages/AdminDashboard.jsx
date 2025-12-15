import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Helper to generate mock data
const generateMockAppCodes = (count) => {
    const projects = ['PaymentService', 'E-commerce', 'Logistics', 'Social Media', 'Finance', 'Weather App', 'CRM', 'HR System', 'Analytics', 'Gateway'];
    const modules = ['Core', 'Auth', 'Payment', 'Inventory', 'UserMgmt', 'Tracking', 'Fleet', 'Feed', 'Messaging', 'Reporting', 'Audit', 'Dashboard', 'API'];

    return Array.from({ length: count }, (_, i) => {
        const project = projects[i % projects.length];
        const module = modules[i % modules.length];
        // Add a suffix to ensure uniqueness if we loop
        const uniqueSuffix = Math.floor(i / projects.length) > 0 ? ` ${Math.floor(i / projects.length) + 1}` : '';

        return {
            id: 100 + i,
            projectName: project,
            moduleName: `${module}${uniqueSuffix}`,
            projectId: `${(i % 20) + 1}` // Reusing project IDs to simulate shared projects
        };
    });
};

const MOCK_APP_CODES = generateMockAppCodes(3);

const generateMockUsers = (count) => {
    return Array.from({ length: count }, (_, i) => {
        // Randomly assign 0 to 3 app codes to each user
        const assignedCodes = [];
        const numAssigned = Math.floor(Math.random() * 4);
        for (let j = 0; j < numAssigned; j++) {
            const randomCode = MOCK_APP_CODES[Math.floor(Math.random() * MOCK_APP_CODES.length)];
            if (!assignedCodes.find(c => c.id === randomCode.id)) {
                assignedCodes.push(randomCode);
            }
        }

        return {
            id: i + 1,
            username: `user_${i + 1}`,
            assignedAppCodes: assignedCodes,
            status: Math.random() > 0.2 ? 'active' : 'inactive' // 80% active
        };
    });
};

const MOCK_USERS = generateMockUsers(50);

export function AdminDashboard() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'appcodes'

    // Local state for management
    const [users, setUsers] = useState(MOCK_USERS);
    const [appCodes, setAppCodes] = useState(MOCK_APP_CODES);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newUserStatus, setNewUserStatus] = useState('active');

    const [newProjectName, setNewProjectName] = useState('');
    const [newModuleName, setNewModuleName] = useState('');
    const [newProjectId, setNewProjectId] = useState('');

    // App Codes tab state
    const [selectedAppCode, setSelectedAppCode] = useState('');
    const [appCodeCollections, setAppCodeCollections] = useState([]);
    const [expandedCollections, setExpandedCollections] = useState(new Set());
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoadingCollections, setIsLoadingCollections] = useState(false);

    // State for Modals
    const [editingUser, setEditingUser] = useState(null); // For "Edit" (Manage Codes)
    const [assigningUser, setAssigningUser] = useState(null); // For "Add" (Assign Code)
    const [isCreatingUser, setIsCreatingUser] = useState(false); // For "Create User" modal
    const [isCreatingAppCode, setIsCreatingAppCode] = useState(false); // For "Create App Code" modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // For Settings Dropdown
    const [selectedAppCodeId, setSelectedAppCodeId] = useState(''); // For the dropdown in "Add" modal

    const handleCreateUser = (e) => {
        e.preventDefault();
        const newUser = {
            id: Date.now(),
            username: newUsername,
            assignedAppCodes: [],
            status: newUserStatus
        };
        setUsers([...users, newUser]);
        setNewUsername('');
        setNewPassword('');
        setNewUserStatus('active');
        setIsCreatingUser(false);
        alert(`User ${newUser.username} created!`);
    };

    const handleCreateAppCode = (e) => {
        e.preventDefault();
        const newCode = {
            id: Date.now(),
            projectName: newProjectName,
            moduleName: newModuleName,
            projectId: newProjectId
        };
        setAppCodes([...appCodes, newCode]);
        setNewProjectName('');
        setNewModuleName('');
        setNewProjectId('');
        setIsCreatingAppCode(false);
        alert(`App Code for ${newCode.projectName} - ${newCode.moduleName} created!`);
    };

    // --- Action Handlers ---

    const handleDeleteUser = (userId) => {
        if (window.confirm("delete all users and corresponding app codes assigned")) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handleUnassignAppCode = (userId, appCodeId) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { ...u, assignedAppCodes: u.assignedAppCodes.filter(ac => ac.id !== appCodeId) };
            }
            return u;
        }));
    };

    const handleAssignAppCode = () => {
        if (!assigningUser || !selectedAppCodeId) return;
        const appCode = appCodes.find(ac => ac.id.toString() === selectedAppCodeId);

        if (appCode) {
            setUsers(users.map(u => {
                if (u.id === assigningUser.id) {
                    return { ...u, assignedAppCodes: [...u.assignedAppCodes, appCode] };
                }
                return u;
            }));
            setAssigningUser(null);
            setSelectedAppCodeId('');
        }
    };

    // Helper to get unassigned codes for a user
    const getUnassignedCodes = (user) => {
        if (!user) return [];
        const assignedIds = user.assignedAppCodes.map(ac => ac.id);
        return appCodes.filter(ac => !assignedIds.includes(ac.id));
    };

    const handleToggleUserStatus = (userId) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
            }
            return u;
        }));
    };

    // Fetch collections when app code is selected
    useEffect(() => {
        const fetchCollections = async () => {
            if (!selectedAppCode) {
                setAppCodeCollections([]);
                return;
            }
            setIsLoadingCollections(true);
            try {
                const appCode = appCodes.find(ac => ac.id.toString() === selectedAppCode);
                if (appCode && appCode.projectId) {
                    // Import apiService to fetch collections
                    const { apiService } = await import('../services/api');
                    const collections = await apiService.getCollectionsByProjectId(appCode.projectId);
                    setAppCodeCollections(collections || []);
                }
            } catch (error) {
                console.error('Error fetching collections:', error);
                setAppCodeCollections([]);
            } finally {
                setIsLoadingCollections(false);
            }
        };
        fetchCollections();
    }, [selectedAppCode, appCodes]);

    const toggleCollection = (collectionId) => {
        const newExpanded = new Set(expandedCollections);
        if (newExpanded.has(collectionId)) {
            newExpanded.delete(collectionId);
        } else {
            newExpanded.add(collectionId);
        }
        setExpandedCollections(newExpanded);
    };

    const handleRequestClick = (request) => {
        setSelectedRequest(request);
    };


    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 focus:outline-none"
                        >
                            Welcome, {user?.username}
                        </button>
                        {/* Dropdown */}
                        {isSettingsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-black/10 z-50 overflow-hidden">
                                    <div className="py-2">
                                        <p className="px-4 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Appearance</p>
                                        <button
                                            onClick={() => { setTheme('light'); setIsSettingsOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center justify-between ${theme === 'light' ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                                        >
                                            Light Mode {theme === 'light' && <span>✓</span>}
                                        </button>
                                        <button
                                            onClick={() => { setTheme('dark'); setIsSettingsOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center justify-between ${theme === 'dark' ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                                        >
                                            Dark Mode {theme === 'dark' && <span>✓</span>}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium">Logout</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Tabs */}
                <div className="flex gap-4 px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-2 px-1 ${activeTab === 'users' ? 'border-b-2 border-red-500 font-bold text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('appcodes')}
                        className={`pb-2 px-1 ${activeTab === 'appcodes' ? 'border-b-2 border-red-500 font-bold text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        App Codes
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6">

                    {activeTab === 'users' && (
                        <div className="flex flex-col gap-8 h-full">
                            {/* User List Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-0">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <h2 className="text-lg font-bold">Users</h2>
                                    <button
                                        onClick={() => setIsCreatingUser(true)}
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium shadow-sm"
                                    >
                                        Create User
                                    </button>
                                </div>
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4">Username</th>
                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-center">App Codes Access</th>
                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-center">Status</th>
                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{u.username}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                            {u.assignedAppCodes.length}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleUserStatus(u.id)}
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${u.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                                }`}
                                                        >
                                                            {u.status === 'active' ? '✓ Active' : '✕ Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => setEditingUser(u)}
                                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => { setAssigningUser(u); setSelectedAppCodeId(''); }}
                                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-xs px-2 py-1 border border-red-100 dark:border-red-900/30 rounded hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'appcodes' && (
                        <div className="flex flex-col gap-4 h-full">
                            {/* App Code Selector */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-lg font-bold whitespace-nowrap">Select App Code</h2>
                                        <select
                                            value={selectedAppCode}
                                            onChange={(e) => setSelectedAppCode(e.target.value)}
                                            className="w-64 md:w-80 border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 focus:border-red-500 outline-none"
                                        >
                                            <option value="">-- Select an App Code --</option>
                                            {appCodes.map(ac => (
                                                <option key={ac.id} value={ac.id}>
                                                    {ac.projectName} - {ac.moduleName} (ID: {ac.projectId})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setIsCreatingAppCode(true)}
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium shadow-sm shrink-0"
                                    >
                                        Create App Code
                                    </button>
                                </div>
                            </div>

                            {/* Collections Table */}
                            {selectedAppCode && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-0">
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                                        <h2 className="text-lg font-bold">Collections & Requests</h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {appCodes.find(ac => ac.id.toString() === selectedAppCode)?.projectName} - {appCodes.find(ac => ac.id.toString() === selectedAppCode)?.moduleName}
                                        </p>
                                    </div>
                                    <div className="overflow-auto flex-1">
                                        {isLoadingCollections ? (
                                            <div className="flex items-center justify-center p-12">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                                    <p className="text-sm text-slate-500">Loading collections...</p>
                                                </div>
                                            </div>
                                        ) : appCodeCollections.length === 0 ? (
                                            <div className="p-12 text-center text-slate-500">
                                                <p>No collections found for this app code.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                                    <tr>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-12"></th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Collection / Request</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Method</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">URL</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                    {appCodeCollections.map(collection => (
                                                        <>
                                                            {/* Collection Row */}
                                                            <tr key={collection.collectionId} className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                                                                <td className="px-6 py-3">
                                                                    <button
                                                                        onClick={() => toggleCollection(collection.collectionId)}
                                                                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                                    >
                                                                        {expandedCollections.has(collection.collectionId) ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                                        )}
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-3 font-bold text-slate-900 dark:text-white" colSpan="3">
                                                                    <div className="flex items-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                                                                        {collection.name}
                                                                        <span className="ml-2 text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                                                                            {collection.requests?.length || 0} requests
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3"></td>
                                                            </tr>

                                                            {/* Request Rows (if expanded) */}
                                                            {expandedCollections.has(collection.collectionId) && collection.requests?.map(request => (
                                                                <tr
                                                                    key={request.requestId}
                                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                                    onClick={() => handleRequestClick(request)}
                                                                >
                                                                    <td className="px-6 py-3"></td>
                                                                    <td className="px-6 py-4 pl-12">
                                                                        <div className="flex items-center gap-2">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                                            {request.name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${request.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                            request.method === 'POST' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                                request.method === 'PUT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                    request.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                        request.method === 'PATCH' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                                            'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                                                                            }`}>
                                                                            {request.method}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-md">
                                                                        {request.url}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRequestClick(request);
                                                                            }}
                                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs px-3 py-1 border border-blue-200 dark:border-blue-900/30 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                        >
                                                                            View Details
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {/* Edit User Modal (Manage Codes) */}
            {
                editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Edit Access: {editingUser.username}</h3>
                                <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-700">✕</button>
                            </div>
                            <div className="p-6">
                                <h4 className="text-sm font-semibold mb-3 text-slate-600 dark:text-slate-400">Assigned App Codes</h4>
                                {users.find(u => u.id === editingUser.id)?.assignedAppCodes.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No app codes assigned.</p>
                                ) : (
                                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                                        {users.find(u => u.id === editingUser.id)?.assignedAppCodes.map(ac => (
                                            <li key={ac.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700 text-sm">
                                                <div>
                                                    <div className="font-medium">{ac.projectName}</div>
                                                    <div className="text-xs text-slate-500">{ac.moduleName}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassignAppCode(editingUser.id, ac.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add App Code Modal */}
            {
                assigningUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg">Assign App Code</h3>
                                <p className="text-xs text-slate-500 mt-1">To user: {assigningUser.username}</p>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-medium mb-2">Select Unassigned App Code</label>
                                <select
                                    value={selectedAppCodeId}
                                    onChange={e => setSelectedAppCodeId(e.target.value)}
                                    className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 mb-4"
                                >
                                    <option value="">-- Select --</option>
                                    {getUnassignedCodes(users.find(u => u.id === assigningUser.id)).map(ac => (
                                        <option key={ac.id} value={ac.id}>{ac.projectName} - {ac.moduleName}</option>
                                    ))}
                                </select>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setAssigningUser(null)} className="px-3 py-2 text-slate-600 dark:text-slate-400 text-sm hover:underline">Cancel</button>
                                    <button
                                        onClick={handleAssignAppCode}
                                        disabled={!selectedAppCodeId}
                                        className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create User Modal */}
            {
                isCreatingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Create New User</h3>
                                <button onClick={() => setIsCreatingUser(false)} className="text-slate-500 hover:text-slate-700">✕</button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={e => setNewUsername(e.target.value)}
                                            className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Status</label>
                                        <select
                                            value={newUserStatus}
                                            onChange={e => setNewUserStatus(e.target.value)}
                                            className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsCreatingUser(false)} className="px-3 py-2 text-slate-600 dark:text-slate-400 text-sm hover:underline">Cancel</button>
                                    <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Create App Code Modal */}
            {
                isCreatingAppCode && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Create New App Code</h3>
                                <button onClick={() => setIsCreatingAppCode(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
                            </div>
                            <form onSubmit={handleCreateAppCode} className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Project Name</label>
                                        <input
                                            type="text"
                                            value={newProjectName}
                                            onChange={e => setNewProjectName(e.target.value)}
                                            className="w-full border rounded p-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                            required
                                            placeholder="e.g. PaymentService"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Module Name</label>
                                        <input
                                            type="text"
                                            value={newModuleName}
                                            onChange={e => setNewModuleName(e.target.value)}
                                            className="w-full border rounded p-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                            required
                                            placeholder="e.g. Auth"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Project ID</label>
                                        <input
                                            type="text"
                                            value={newProjectId}
                                            onChange={e => setNewProjectId(e.target.value)}
                                            className="w-full border rounded p-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                            required
                                            placeholder="e.g. proj_123"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingAppCode(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm hover:underline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium shadow-sm"
                                    >
                                        Create App Code
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Request Details Modal */}
            {
                selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Request Details</h3>
                                <button onClick={() => setSelectedRequest(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="space-y-6">
                                    {/* Name & Method */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Request Name</label>
                                        <p className="text-base font-medium">{selectedRequest.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Method</label>
                                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded ${selectedRequest.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                selectedRequest.method === 'POST' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    selectedRequest.method === 'PUT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        selectedRequest.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            selectedRequest.method === 'PATCH' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                'bg-slate-100 text-slate-700'
                                                }`}>
                                                {selectedRequest.method}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Request ID</label>
                                            <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{selectedRequest.requestId}</p>
                                        </div>
                                    </div>

                                    {/* URL */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">URL</label>
                                        <p className="text-sm font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 break-all">
                                            {selectedRequest.url}
                                        </p>
                                    </div>

                                    {/* Headers */}
                                    {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Headers</label>
                                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400">Key</th>
                                                            <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {Object.entries(selectedRequest.headers).map(([key, value]) => (
                                                            <tr key={key}>
                                                                <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{key}</td>
                                                                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{value}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Body */}
                                    {selectedRequest.body && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Body</label>
                                            <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
                                                {typeof selectedRequest.body === 'string' ? selectedRequest.body : JSON.stringify(selectedRequest.body, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-right">
                                <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
