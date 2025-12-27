import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Settings } from '../components/Settings';
import { Header } from '../components/Header';
import { Settings as SettingsIcon, LogOut, Layout as LayoutIcon, User as UserIcon, Shield } from 'lucide-react';
import { Layout } from '../components/Layout';



export function AdminDashboard() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();


    // Local state for management
    const [users, setUsers] = useState([]);
    const [appCodes, setAppCodes] = useState([]);
    const [allHierarchyData, setAllHierarchyData] = useState([]);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
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
    const [editingUserProjectDetails, setEditingUserProjectDetails] = useState([]);
    const [isFetchingProjectDetails, setIsFetchingProjectDetails] = useState(false);

    const [selectedProjectCode, setSelectedProjectCode] = useState('');
    const [selectedModuleName, setSelectedModuleName] = useState('');
    // State for Assignment Modal
    const [assignProjectCode, setAssignProjectCode] = useState('');
    const [assignModuleName, setAssignModuleName] = useState('');
    const [selectedAppCodeId, setSelectedAppCodeId] = useState(''); // For the dropdown in "Add" modal
    const [activeView, setActiveView] = useState('users'); // 'users', 'appcodes', or 'settings'
    const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || '');
    const [localCollectionsPath, setLocalCollectionsPath] = useState(localStorage.getItem('localCollectionsPath') || '');
    const [layout, setLayout] = useState(localStorage.getItem('layout') || 'horizontal');

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

    useEffect(() => {
        localStorage.setItem('layout', layout);
    }, [layout]);

    const fetchUsers = async () => {
        if (user) {
            try {
                const { getAllUsers } = await import('../services/apiservice');
                const fetchedUsers = await getAllUsers(user);
                if (fetchedUsers) {
                    const filteredUsers = fetchedUsers.filter(u => u.userName !== user.username);
                    setUsers(filteredUsers.map(u => ({
                        ...u,
                        id: u.id || u.userId,
                        assignedAppCodes: u.assignedAppCodes || []
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        }
    };

    const fetchAppCodes = async () => {
        if (user) {
            try {
                const { getAllAppCodesForAdmin } = await import('../services/apiservice');
                const data = await getAllAppCodesForAdmin(user);
                setAllHierarchyData(data);
                const mappedCodes = data.map((item) => ({
                    id: `${item.projectCode}-${item.moduleName}`,
                    projectName: item.projectCode,
                    moduleName: item.moduleName,
                    projectId: item.projectId || item.id, // Use numeric projectId from API
                    projectCode: item.projectCode, // Keep projectCode for display
                    collections: item.collections || []
                }));
                setAppCodes(mappedCodes);
            } catch (error) {
                console.error('Failed to fetch app codes:', error);
            }
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchUsers();
        fetchAppCodes();
    }, [user]);

    // Hydrate users with assigned app codes when hierarchy data is available
    useEffect(() => {
        if (allHierarchyData.length > 0 && users.length > 0) {
            let hasChanges = false;

            const updatedUsers = users.map(u => {
                // Only hydrate if we have projectIds but NO app codes assigned yet
                // This prevents infinite loops if some PIDs are invalid/not found
                if (u.projectIds && u.projectIds.length > 0 && (!u.assignedAppCodes || u.assignedAppCodes.length === 0)) {

                    const hydratedCodes = u.projectIds.map(pid => {
                        // Handle potential object wrapper or primitive
                        const searchId = (typeof pid === 'object' && pid !== null)
                            ? (pid.projectId || pid.id || pid.projectCode)
                            : pid;

                        // Find matching code in hierarchy (loose equality for string/number match)
                        const found = allHierarchyData.find(h =>
                            h.projectId == searchId ||
                            h.projectCode == searchId ||
                            h.id == searchId
                        );

                        if (found) {
                            return {
                                ...found,
                                id: found.id || `${found.projectCode}-${found.moduleName}`,
                                projectName: found.projectCode || found.projectName,
                                moduleName: found.moduleName
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    if (hydratedCodes.length > 0) {
                        hasChanges = true;
                        return { ...u, assignedAppCodes: hydratedCodes };
                    }
                }
                return u;
            });

            if (hasChanges) {
                setUsers(updatedUsers);
            }
        }
    }, [allHierarchyData, users]);

    // Refresh on view switch
    useEffect(() => {
        if (activeView === 'users') {
            fetchUsers();
        } else if (activeView === 'appcodes') {
            fetchAppCodes();
        }
    }, [activeView]);

    // Helper to generate profile image
    const generateProfileImage = (username) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        // Random pastel background
        const hue = Math.floor(Math.random() * 360);
        ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
        ctx.fillRect(0, 0, 100, 100);

        // Text (First letter)
        ctx.fillStyle = '#333';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = username ? username.charAt(0).toUpperCase() : '?';
        ctx.fillText(letter, 50, 50);

        return canvas.toDataURL('image/png'); // Base64 string
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        try {
            const profileImageData = generateProfileImage(newUsername);

            const userData = {
                username: newUsername,
                password: newPassword,
                role: newUserRole,
                status: newUserStatus,
                profileImage: profileImageData
            };

            // Dynamically import register to avoid top-level dependency issues if any
            const { register } = await import('../services/apiservice');
            const createdUser = await register(userData);

            // Update local state for immediate feedback
            // Assuming backend returns the created user object or we construct a display version
            const userForDisplay = {
                ...userData,
                id: createdUser?.id || Date.now(),
                assignedAppCodes: []
            };

            setUsers([...users, userForDisplay]);
            setNewUsername('');
            setNewPassword('');
            setNewUserRole('user');
            setNewUserStatus('active');
            setIsCreatingUser(false);

            // Refresh user list from server
            await fetchUsers();

            alert(`User ${userData.username} created successfully!`);
        } catch (error) {
            console.error('Failed to create user:', error);
            alert(`Error creating user: ${error.message}`);
        }
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

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user and all assigned app codes?")) {
            try {
                const { deleteUser } = await import('../services/apiservice');
                const validUserId = parseInt(userId, 10);
                if (isNaN(validUserId)) {
                    alert('Error: Invalid User ID for deletion.');
                    return;
                }
                await deleteUser(validUserId, user?.token);

                // Refresh user list from server
                await fetchUsers();

                alert('User deleted successfully');
            } catch (error) {
                console.error('Failed to delete user:', error);
                const backendMsg = error.response?.data?.data?.message || error.message;
                alert(`Error deleting user: ${backendMsg}`);
            }
        }
    };

    const handleUnassignAppCode = async (userId, appCodeId) => {
        if (!window.confirm("Are you sure you want to unassign this project?")) return;

        try {
            const { unassignUserFromProject } = await import('../services/apiservice');

            // Find the project object to get the valid numeric projectId
            const userInState = users.find(u => u.id === userId);

            // Look in editing details first, then in the user state
            const projectObj = editingUserProjectDetails.find(ac => (ac.id === appCodeId || ac.projectCode === appCodeId)) ||
                userInState?.assignedAppCodes?.find(ac => (ac.id === appCodeId || ac.projectCode === appCodeId));

            // Extract numeric ID
            let projectIdToUnassign = null;

            if (projectObj) {
                // Prioritize explicit numeric projectId
                if (projectObj.projectId) projectIdToUnassign = projectObj.projectId;
                // Fallback to 'id' if it looks numeric
                else if (projectObj.id && !isNaN(parseInt(projectObj.id))) projectIdToUnassign = projectObj.id;
            } else {
                // If no object found, check if the passed appCodeId itself is numeric
                if (!isNaN(parseInt(appCodeId))) projectIdToUnassign = appCodeId;
            }

            // Strict Validation
            const validProjectId = parseInt(projectIdToUnassign, 10);
            const validUserId = parseInt(userId, 10);

            if (isNaN(validProjectId)) {
                console.error('Invalid/Missing Project ID. Obj:', projectObj, 'Raw:', appCodeId);
                alert('Error: Could not determine numeric Project ID for deletion.');
                return;
            }
            if (isNaN(validUserId)) {
                console.error('Invalid User ID:', userId);
                alert('Error: Invalid User ID.');
                return;
            }

            console.log(`Unassigning User ${validUserId} from Project ${validProjectId}`);

            await unassignUserFromProject(validUserId, validProjectId, user?.token);

            // Update local state and refresh
            setUsers(users.map(u => {
                if (u.id === userId) {
                    return { ...u, assignedAppCodes: (u.assignedAppCodes || []).filter(ac => (ac.id || ac.projectCode) !== appCodeId) };
                }
                return u;
            }));

            if (editingUser && editingUser.id === userId) {
                setEditingUserProjectDetails(prev => prev.filter(ac => (ac.id || ac.projectCode) !== appCodeId));
            }

            // Refresh from server to be sure
            await fetchUsers();

            alert('Project unassigned successfully');
        } catch (error) {
            console.error('Failed to unassign project:', error);
            const backendMsg = error.response?.data?.data?.message || error.message;
            alert(`Error unassigning project: ${backendMsg}`);
        }
    };

    const handleAssignAppCode = async () => {
        if (!assigningUser || !selectedAppCodeId) return;
        const appCode = appCodes.find(ac => ac.id.toString() === selectedAppCodeId);

        if (appCode) {
            try {
                const { assignUserToProject } = await import('../services/apiservice');

                // Ensure numeric IDs
                const projectIdToAssign = parseInt(appCode.projectId, 10);
                if (isNaN(projectIdToAssign)) {
                    console.error('Invalid Project ID:', appCode);
                    alert('Cannot assign: Invalid numeric Project ID found.');
                    return;
                }

                if (!user?.token || user.token === 'mock-token') {
                    alert('Error: Authentication token is missing or invalid. Please logout and login again.');
                    return;
                }

                // Determine User ID
                const rawUserId = assigningUser.userId || assigningUser.id;
                const userIdToAssign = parseInt(rawUserId, 10);
                if (isNaN(userIdToAssign)) {
                    console.error('Invalid User ID:', assigningUser);
                    alert('Cannot assign: Invalid numeric User ID found.');
                    return;
                }

                console.log(`Assigning User ${userIdToAssign} to Project ${projectIdToAssign}`);

                await assignUserToProject(userIdToAssign, projectIdToAssign, user?.token);

                // Refresh user list from server to reflect changes
                await fetchUsers();

                setAssigningUser(null);
                setSelectedAppCodeId('');
                alert('Project assigned successfully');
            } catch (error) {
                console.error('Failed to assign project:', error);
                // Extract possible detailed message from proxy/backend response
                const backendMsg = error.response?.data?.data?.message || error.message;
                alert(`Error assigning project: ${backendMsg}`);
            }
        }
    };

    // Helper to get unassigned codes for a user
    const getUnassignedCodes = (user) => {
        if (!user || !user.assignedAppCodes) return [];
        const assignedIds = user.assignedAppCodes.filter(Boolean).map(ac => ac.id);
        return appCodes.filter(ac => !assignedIds.includes(ac.id));
    };

    const handleUpdateUserStatus = async (userId, newStatus) => {
        try {
            const { updateUser } = await import('../services/apiservice');
            const validUserId = parseInt(userId, 10);
            if (isNaN(validUserId)) {
                alert('Error: Invalid User ID.');
                return;
            }

            await updateUser({ userId: validUserId, status: newStatus }, user?.token);

            // Refresh from server
            await fetchUsers();

            // Update local editing user if open
            if (editingUser && editingUser.id === userId) {
                setEditingUser(prev => ({ ...prev, status: newStatus }));
            }

            alert(`User status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            const backendMsg = error.response?.data?.data?.message || error.message;
            alert(`Error updating status: ${backendMsg}`);
        }
    };

    const handleToggleUserStatus = (userId) => {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
            const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
            handleUpdateUserStatus(userId, nextStatus);
        }
    };

    const handleEditUser = async (userToEdit) => {
        setEditingUser(userToEdit);
        setEditingUserProjectDetails([]);

        const userId = userToEdit.userId || userToEdit.id;
        // Use projectIds if available, fallback to assignedAppCodes mapping
        const projectIds = userToEdit.projectIds || [];

        if (projectIds.length > 0) {
            setIsFetchingProjectDetails(true);
            try {
                const { GetProjectDetails } = await import('../services/apiservice');
                const details = await GetProjectDetails(projectIds, user?.token);
                setEditingUserProjectDetails(details || []);
            } catch (error) {
                console.error('Failed to fetch project details:', error);
            } finally {
                setIsFetchingProjectDetails(false);
            }
        }
    };

    // Update collections when app code is selected
    useEffect(() => {
        if (!selectedAppCode) {
            setAppCodeCollections([]);
            return;
        }

        // Find the selected item in our local full hierarchy data
        const selectedItem = appCodes.find(ac => ac.id === selectedAppCode);

        if (selectedItem) {
            setAppCodeCollections(selectedItem.collections || []);
        } else {
            setAppCodeCollections([]);
        }
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
            <Header
                user={user}
                onLogout={() => { logout(); navigate('/login'); }}
                theme={theme}
                setTheme={setTheme}
                activeView={activeView}
                setActiveView={setActiveView}
                profilePic={profilePic}
            />

            <Layout activeView={activeView} setActiveView={setActiveView}>
                {activeView === 'settings' ? (
                    <Settings
                        user={user}
                        theme={theme}
                        setTheme={setTheme}
                        layout={layout}
                        setLayout={setLayout}
                        profilePic={profilePic}
                        setProfilePic={setProfilePic}
                        onLogout={logout}
                        localCollectionsPath={localCollectionsPath}
                        setLocalCollectionsPath={setLocalCollectionsPath}
                    />
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">

                            {activeView === 'users' && (
                                <div className="flex flex-col gap-8 h-full">
                                    {/* User List Table */}
                                    {/* ... User List Table Content ... */}
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
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-12"></th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/5">Username</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/5">Role</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/5 text-center">App Codes</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/5 text-center">Status</th>
                                                        <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/5 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                    {users.map(u => (
                                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                    {u.profileImage ? (
                                                                        <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-slate-500">{u.userName?.substring(0, 2).toUpperCase()}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium">{u.userName}</td>
                                                            <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-400">{u.userRole}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                                    {u.projectCount}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="px-6 py-4 capitalize text-slate-600 dark:text-slate-400">
                                                                    {u.userStatus}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right space-x-2">
                                                                <button
                                                                    onClick={() => handleEditUser(u)}
                                                                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setAssigningUser(u);
                                                                        setSelectedAppCodeId('');
                                                                        setAssignProjectCode('');
                                                                        setAssignModuleName('');
                                                                    }}
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

                            {activeView === 'appcodes' && (
                                <div className="flex flex-col gap-4 h-full">
                                    {/* App Code Selector */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-lg font-bold whitespace-nowrap">App Code</h2>

                                                {/* Project Dropdown */}
                                                <select
                                                    value={selectedProjectCode}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedProjectCode(val);
                                                        setSelectedModuleName(''); // Reset module
                                                        setSelectedAppCode(''); // Reset final selection
                                                    }}
                                                    className="w-48 border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 focus:border-red-500 outline-none"
                                                >
                                                    <option value="">-- Project --</option>
                                                    {[...new Set(appCodes.map(ac => ac.projectName))].map(projName => (
                                                        <option key={projName} value={projName}>
                                                            {projName}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Module Dropdown */}
                                                <select
                                                    value={selectedModuleName}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedModuleName(val);
                                                        if (selectedProjectCode && val) {
                                                            const found = appCodes.find(ac => ac.projectName === selectedProjectCode && ac.moduleName === val);
                                                            if (found) {
                                                                setSelectedAppCode(found.id);
                                                            }
                                                        } else {
                                                            setSelectedAppCode('');
                                                        }
                                                    }}
                                                    className="w-48 border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 focus:border-red-500 outline-none"
                                                    disabled={!selectedProjectCode}
                                                >
                                                    <option value="">-- Module --</option>
                                                    {appCodes
                                                        .filter(ac => ac.projectName === selectedProjectCode)
                                                        .map(ac => (
                                                            <option key={ac.moduleName} value={ac.moduleName}>
                                                                {ac.moduleName}
                                                            </option>
                                                        ))
                                                    }
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
                                            <div className="overflow-auto flex-1">
                                                {/* ... Collections Table Content (same as before) ... */}
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
                                                    <table className="w-full text-left text-sm table-fixed">
                                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                                            <tr>
                                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-12"></th>
                                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-4/12">Collection / Request</th>
                                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-2/12">Method</th>
                                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-4/12">URL</th>
                                                                <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-2/12 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                            {appCodeCollections.map(collection => (
                                                                <Fragment key={collection.collectionId}>
                                                                    {/* Collection Row */}
                                                                    <tr className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
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
                                                                            <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
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
                                                                </Fragment>
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
                )}
            </Layout>

            {/* Edit User Modal (Manage Codes) */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Edit Access: {editingUser.username}</h3>
                            <button onClick={() => { setEditingUser(null); fetchUsers(); }} className="text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">User Status</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Affects immediate login access</span>
                            </div>
                            <select
                                value={editingUser.status || 'active'}
                                onChange={(e) => handleUpdateUserStatus(editingUser.id, e.target.value)}
                                className="text-xs font-black bg-slate-50 dark:bg-slate-900 text-red-600 border border-slate-100 dark:border-slate-700 rounded-md px-4 py-2 outline-none transition-all cursor-pointer shadow-sm hover:shadow-md appearance-none min-w-[140px] text-center"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="resetpassword">Reset Password</option>
                            </select>
                        </div>

                        <div className="p-6">
                            <h4 className="text-sm font-semibold mb-3 text-slate-600 dark:text-slate-400">Assigned App Codes</h4>



                            {isFetchingProjectDetails ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                </div>
                            ) : (editingUserProjectDetails.length > 0 || (users.find(u => u.id === editingUser.id)?.assignedAppCodes.length > 0)) ? (
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {/* Show fetched details if available, otherwise fallback to existing assignedAppCodes */}
                                    {(editingUserProjectDetails.length > 0 ? editingUserProjectDetails : users.find(u => u.id === editingUser.id)?.assignedAppCodes || []).map(ac => (
                                        <li key={ac.id || ac.projectCode} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700 text-sm">
                                            <div>
                                                <div className="font-medium">{ac.projectName || ac.projectCode}</div>
                                                <div className="text-xs text-slate-500">{ac.moduleName || ac.description}</div>
                                            </div>
                                            <button
                                                onClick={() => handleUnassignAppCode(editingUser.id, ac.id || ac.projectCode)}
                                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No app codes assigned.</p>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right">
                            <button onClick={() => { setEditingUser(null); fetchUsers(); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add App Code Modal */}
            {assigningUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg">Assign App Code</h3>
                            <p className="text-xs text-slate-500 mt-1">To user: {assigningUser.username}</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Project</label>
                            <select
                                value={assignProjectCode}
                                onChange={e => {
                                    setAssignProjectCode(e.target.value);
                                    setAssignModuleName('');
                                    setSelectedAppCodeId('');
                                }}
                                className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 mb-4 outline-none focus:border-red-500"
                            >
                                <option value="">-- Select Project --</option>
                                {[...new Set(getUnassignedCodes(users.find(u => u.id === assigningUser.id)).map(ac => ac.projectName))].map(proj => (
                                    <option key={proj} value={proj}>{proj}</option>
                                ))}
                            </select>

                            <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Module</label>
                            <select
                                value={assignModuleName}
                                onChange={e => {
                                    const val = e.target.value;
                                    setAssignModuleName(val);
                                    const unassigned = getUnassignedCodes(users.find(u => u.id === assigningUser.id));
                                    const match = unassigned.find(ac => ac.projectName === assignProjectCode && ac.moduleName === val);
                                    setSelectedAppCodeId(match ? match.id : '');
                                }}
                                className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700 mb-4 outline-none focus:border-red-500"
                                disabled={!assignProjectCode}
                            >
                                <option value="">-- Select Module --</option>
                                {getUnassignedCodes(users.find(u => u.id === assigningUser.id))
                                    .filter(ac => ac.projectName === assignProjectCode)
                                    .map(ac => (
                                        <option key={ac.moduleName} value={ac.moduleName}>{ac.moduleName}</option>
                                    ))
                                }
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
            )}

            {/* Create User Modal */}
            {isCreatingUser && (
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
                                    <label className="block text-xs font-medium mb-1">Role</label>
                                    <select
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value)}
                                        className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
                                    >
                                        <option value="developer">Developer</option>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>

                                    </select>
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
                                        <option value="resetpassword">ResetPassword</option>
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
            )}

            {/* Create App Code Modal */}
            {isCreatingAppCode && (
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
            )}

            {/* Request Details Modal */}
            {selectedRequest && (
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
                                {(() => {
                                    let headers = selectedRequest.headers;
                                    if (typeof headers === 'string') {
                                        try {
                                            headers = JSON.parse(headers);
                                        } catch (e) {
                                            headers = {}; // Fallback if parsing fails
                                        }
                                    }

                                    if (headers && Object.keys(headers).length > 0) {
                                        return (
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
                                                            {Object.entries(headers).map(([key, value]) => (
                                                                <tr key={key}>
                                                                    <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{key}</td>
                                                                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{String(value)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

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
            )}
        </div>
    );
}
