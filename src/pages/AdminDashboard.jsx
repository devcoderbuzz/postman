import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Mock Data until API is ready
const MOCK_USERS = [
    { id: 1, username: 'dev1', assignedAppCodes: [] },
    { id: 2, username: 'dev2', assignedAppCodes: [] }
];

const MOCK_APP_CODES = [
    { id: 101, projectName: 'PaymentService', moduleName: 'Core', projectId: 'proj_pay_core' },
    { id: 102, projectName: 'PaymentService', moduleName: 'Auth', projectId: 'proj_pay_auth' },
    { id: 103, projectName: 'Inventory', moduleName: 'Stock', projectId: 'proj_inv_stock' },
];

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

    const [newProjectName, setNewProjectName] = useState('');
    const [newModuleName, setNewModuleName] = useState('');
    const [newProjectId, setNewProjectId] = useState('');

    // State for Modals
    const [editingUser, setEditingUser] = useState(null); // For "Edit" (Manage Codes)
    const [assigningUser, setAssigningUser] = useState(null); // For "Add" (Assign Code)
    const [isCreatingUser, setIsCreatingUser] = useState(false); // For "Create User" modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // For Settings Dropdown
    const [selectedAppCodeId, setSelectedAppCodeId] = useState(''); // For the dropdown in "Add" modal

    const handleCreateUser = (e) => {
        e.preventDefault();
        const newUser = {
            id: Date.now(),
            username: newUsername,
            assignedAppCodes: []
        };
        setUsers([...users, newUser]);
        setNewUsername('');
        setNewPassword('');
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
        alert(`App Code for ${newCode.projectName} created!`);
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


    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 focus:outline-none"
                        >
                            Welcome, {user?.username}
                        </button>
                        {/* Dropdown */}
                        {isSettingsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl shadow-black/10 z-50 overflow-hidden">
                                    <div className="py-2">
                                        <p className="px-4 py-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Appearance</p>
                                        <button
                                            onClick={() => { setTheme('light'); setIsSettingsOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm flex items-center justify-between ${theme === 'light' ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-300'}`}
                                        >
                                            Light Mode {theme === 'light' && <span>✓</span>}
                                        </button>
                                        <button
                                            onClick={() => { setTheme('dark'); setIsSettingsOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm flex items-center justify-between ${theme === 'dark' ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-300'}`}
                                        >
                                            Dark Mode {theme === 'dark' && <span>✓</span>}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm font-medium">Logout</button>
                </div>
            </div>

            <div className="container mx-auto p-6">

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-neutral-200 dark:border-neutral-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-2 px-1 ${activeTab === 'users' ? 'border-b-2 border-red-500 font-bold text-red-600 dark:text-red-400' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('appcodes')}
                        className={`pb-2 px-1 ${activeTab === 'appcodes' ? 'border-b-2 border-red-500 font-bold text-red-600 dark:text-red-400' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        App Codes
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="flex flex-col gap-8">
                        {/* User List Table */}
                        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold">Users</h2>
                                <button
                                    onClick={() => setIsCreatingUser(true)}
                                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium shadow-sm"
                                >
                                    Create User
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-neutral-600 dark:text-neutral-300">Username</th>
                                            <th className="px-6 py-3 font-semibold text-neutral-600 dark:text-neutral-300">App Codes Access</th>
                                            <th className="px-6 py-3 font-semibold text-neutral-600 dark:text-neutral-300 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium">{u.username}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300">
                                                        {u.assignedAppCodes.length}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium text-xs px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { setAssigningUser(u); setSelectedAppCodeId(''); }}
                                                        className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium text-xs px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* App Code List */}
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                            <h2 className="text-lg font-bold mb-4">App Codes</h2>
                            <ul className="space-y-3">
                                {appCodes.map(ac => (
                                    <li key={ac.id} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded border border-neutral-100 dark:border-neutral-700">
                                        <div className="font-medium">{ac.projectName}</div>
                                        <div className="text-xs text-neutral-500 flex gap-4 mt-1">
                                            <span>Module: {ac.moduleName}</span>
                                            <span>ID: {ac.projectId}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Create App Code */}
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 h-fit">
                            <h2 className="text-lg font-bold mb-4">Create App Code</h2>
                            <form onSubmit={handleCreateAppCode} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Project Name</label>
                                    <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" required placeholder="e.g. PaymentService" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Module Name</label>
                                    <input type="text" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" required placeholder="e.g. Auth" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Project ID</label>
                                    <input type="text" value={newProjectId} onChange={e => setNewProjectId(e.target.value)} className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" required placeholder="e.g. proj_123" />
                                </div>
                                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">Create App Code</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal (Manage Codes) */}
            {
                editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Edit Access: {editingUser.username}</h3>
                                <button onClick={() => setEditingUser(null)} className="text-neutral-500 hover:text-neutral-700">✕</button>
                            </div>
                            <div className="p-6">
                                <h4 className="text-sm font-semibold mb-3 text-neutral-600 dark:text-neutral-400">Assigned App Codes</h4>
                                {users.find(u => u.id === editingUser.id)?.assignedAppCodes.length === 0 ? (
                                    <p className="text-sm text-neutral-500 italic">No app codes assigned.</p>
                                ) : (
                                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                                        {users.find(u => u.id === editingUser.id)?.assignedAppCodes.map(ac => (
                                            <li key={ac.id} className="flex justify-between items-center p-2 bg-neutral-50 dark:bg-neutral-900 rounded border border-neutral-100 dark:border-neutral-700 text-sm">
                                                <div>
                                                    <div className="font-medium">{ac.projectName}</div>
                                                    <div className="text-xs text-neutral-500">{ac.moduleName}</div>
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
                            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 text-right">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add App Code Modal */}
            {
                assigningUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 className="font-bold text-lg">Assign App Code</h3>
                                <p className="text-xs text-neutral-500 mt-1">To user: {assigningUser.username}</p>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-medium mb-2">Select Unassigned App Code</label>
                                <select
                                    value={selectedAppCodeId}
                                    onChange={e => setSelectedAppCodeId(e.target.value)}
                                    className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700 mb-4"
                                >
                                    <option value="">-- Select --</option>
                                    {getUnassignedCodes(users.find(u => u.id === assigningUser.id)).map(ac => (
                                        <option key={ac.id} value={ac.id}>{ac.projectName} - {ac.moduleName}</option>
                                    ))}
                                </select>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setAssigningUser(null)} className="px-3 py-2 text-neutral-600 dark:text-neutral-400 text-sm hover:underline">Cancel</button>
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
                        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Create New User</h3>
                                <button onClick={() => setIsCreatingUser(false)} className="text-neutral-500 hover:text-neutral-700">✕</button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={e => setNewUsername(e.target.value)}
                                            className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
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
                                            className="w-full border rounded p-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsCreatingUser(false)} className="px-3 py-2 text-neutral-600 dark:text-neutral-400 text-sm hover:underline">Cancel</button>
                                    <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
