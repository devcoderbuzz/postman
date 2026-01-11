import { useState, useEffect, useMemo, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Settings } from '../components/Settings';
import { Header } from '../components/Header';
import { getEnvDetails, updateEnvDetails } from '../services/apiservice';
import { EnvironmentManager } from '../components/EnvironmentManager';
import { KeyValueEditor } from '../components/KeyValueEditor';
import { Settings as SettingsIcon, LogOut, Layout as LayoutIcon, User as UserIcon, Shield, Save, Check, Globe, X, ChevronDown, Trash2, Box, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';




export function AdminDashboard() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();


    // Local state for management
    const [users, setUsers] = useState([]);
    const [appCodes, setAppCodes] = useState([]);
    const [allRawEnvironments, setAllRawEnvironments] = useState([]);
    const [activeEnv, setActiveEnv] = useState(null);
    const [showEnvSaveSuccess, setShowEnvSaveSuccess] = useState(false);
    const [showUserStatusSuccess, setShowUserStatusSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [allHierarchyData, setAllHierarchyData] = useState([]);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [newAppCode, setNewAppCode] = useState('');


    const [appCode, setAppCode] = useState('');
    const [newModuleName, setNewModuleName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newProjectId, setNewProjectId] = useState('');
    const [editingAppCodeId, setEditingAppCodeId] = useState(null);

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

    const [selectedAppCodeName, setSelectedAppCodeName] = useState('');
    const [selectedModuleName, setSelectedModuleName] = useState('');
    // State for Assignment Modal
    const [assignAppCodeName, setAssignAppCodeName] = useState('');
    const [assignModuleName, setAssignModuleName] = useState('');
    const [selectedAppCodeId, setSelectedAppCodeId] = useState(''); // For the dropdown in "Add" modal
    const [activeView, setActiveView] = useState('users'); // 'users', 'appcodes', 'settings', or 'environments'
    const [appCodeModalTab, setAppCodeModalTab] = useState('users'); // 'users' or 'details'
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [appCodeSearchTerm, setAppCodeSearchTerm] = useState('');
    const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
    const [envSearchTerm, setEnvSearchTerm] = useState('');

    const fetchEnvironments = async () => {
        if (!user || !user.token) return;
        try {
            console.log("Admin: Executing fetchEnvironments...");
            const envData = await getEnvDetails(null, user.token);
            console.log("Admin: fetchEnvironments API RAW result:", envData);
            if (envData) {
                setAllRawEnvironments(envData);
            }
        } catch (e) {
            console.error('Admin: Failed to fetch all environment details:', e);
            setAllRawEnvironments([]);
        }
    };

    const environments = useMemo(() => {
        let raw = allRawEnvironments;
        if (!raw || !appCodes.length) return [];

        // 1. Find the target numeric projectId from our dropdown selection
        const selectedProjectInfo = appCodes.find(ac =>
            ac.projectName === selectedAppCodeName &&
            ac.moduleName === selectedModuleName
        );

        if (!selectedProjectInfo) return [];

        // Use the ID resolved from appCodes (which now correctly picks up projectID from the server)
        const targetProjectId = selectedProjectInfo.projectId || selectedProjectInfo.id;

        console.log("Admin Filtering Environments:", {
            targetProjectId,
            selectedAppCodeName,
            selectedModuleName
        });

        if (raw.data && !Array.isArray(raw)) raw = raw.data;

        let environmentsToProcess = [];

        if (Array.isArray(raw)) {
            // Check if it's Project-Grouped (your provided format)
            const first = raw[0];
            const isProjectGrouped = !!(first.environments || first.envs);

            if (isProjectGrouped) {
                // Find the project object that matches our targetProjectId
                const match = raw.find(p => {
                    const pid = p.projectID || p.projectId || p.id;
                    return String(pid) === String(targetProjectId);
                });

                if (match) {
                    environmentsToProcess = match.environments || match.envs || [];
                } else {
                    // Fallback: If no ID match, try matching by name as a safety net
                    const nameMatch = raw.find(p => (p.projectName || p.projectName) === selectedAppCodeName);
                    if (nameMatch) environmentsToProcess = nameMatch.environments || nameMatch.envs || [];
                }
            } else {
                // Flat list filtering
                environmentsToProcess = raw.filter(e => {
                    const eid = e.projectID || e.projectId || e.id;
                    return String(eid) === String(targetProjectId);
                });
            }
        }

        return environmentsToProcess.map(env => ({
            id: String(env.envID || env.id || env.envName || Math.random()),
            name: env.envName || env.name || 'Unnamed',
            variables: (env.variables || []).map(v => ({
                id: v.id,
                key: v.variableKey || v.key || '',
                value: String(v.variableValue || v.value || ''),
                active: true
            }))
        }));
    }, [allRawEnvironments, selectedAppCodeName, selectedModuleName, appCodes]);

    // Update activeEnv when environments change
    useEffect(() => {
        if (environments.length > 0) {
            if (!activeEnv || !environments.find(e => e.id === activeEnv)) {
                setActiveEnv(environments[0].id);
            }
        } else {
            if (activeEnv !== null) setActiveEnv(null);
        }
    }, [environments, activeEnv]);

    const refreshAppCode = () => {
        if (selectedAppCodeName) {
            fetchAppCodes();
            if (selectedModuleName) {
                fetchEnvironments();
            }
        }
    };

    const refreshModule = () => {
        if (selectedAppCodeName && selectedModuleName) {
            fetchEnvironments();
        }
    };

    const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || '');
    const [localCollectionsPath, setLocalCollectionsPath] = useState(localStorage.getItem('localCollectionsPath') || '');
    const [layout, setLayout] = useState(localStorage.getItem('layout') || 'horizontal');

    // Calculate user counts for each app code
    const appCodesWithUserCounts = useMemo(() => {
        const counts = {};
        users.forEach(u => {
            const pids = new Set();
            // Check raw projectIds
            u.projectIds?.forEach(pid => {
                const id = (typeof pid === 'object' && pid !== null) ? (pid.projectId || pid.id) : pid;
                if (id) pids.add(String(id));
            });
            // Check hydrated assignedAppCodes
            u.assignedAppCodes?.forEach(ac => {
                if (ac.projectId) pids.add(String(ac.projectId));
                if (ac.id) pids.add(String(ac.id));
            });

            pids.forEach(id => {
                counts[id] = (counts[id] || 0) + 1;
            });
        });

        return appCodes.map(code => ({
            ...code,
            userCount: counts[String(code.projectId)] || counts[String(code.id)] || 0
        }));
    }, [appCodes, users]);

    const filteredAppCodesWithUserCounts = useMemo(() => {
        if (!appCodeSearchTerm) return appCodesWithUserCounts;
        const term = appCodeSearchTerm.toLowerCase();
        return appCodesWithUserCounts.filter(code =>
            (code.appCode || '').toLowerCase().includes(term) ||
            (code.moduleName || '').toLowerCase().includes(term) ||
            (code.description || '').toLowerCase().includes(term)
        );
    }, [appCodesWithUserCounts, appCodeSearchTerm]);

    const filteredUsers = useMemo(() => {
        if (!userSearchTerm) return users;
        const term = userSearchTerm.toLowerCase();
        return users.filter(u =>
            (u.userName || '').toLowerCase().includes(term) ||
            (u.userRole || '').toLowerCase().includes(term) ||
            (u.userStatus || '').toLowerCase().includes(term)
        );
    }, [users, userSearchTerm]);

    // Calculate users assigned to the currently editing app code
    const assignedUsers = useMemo(() => {
        if (!editingAppCodeId) return [];
        return users.filter(u =>
            u.projectIds?.some(pid => {
                const id = (typeof pid === 'object' && pid !== null) ? (pid.projectId || pid.id) : pid;
                return String(id) === String(editingAppCodeId);
            }) ||
            u.assignedAppCodes?.some(ac =>
                String(ac.projectId || ac.id) === String(editingAppCodeId)
            )
        );
    }, [users, editingAppCodeId]);

    const derivedProjects = useMemo(() => {
        const uniqueNames = [...new Set(appCodes.map(ac => ac.projectName))];
        return uniqueNames.map(name => ({ id: name, name }));
    }, [appCodes]);

    const derivedModules = useMemo(() => {
        if (!selectedAppCodeName) return [];
        return appCodes
            .filter(ac => ac.projectName === selectedAppCodeName)
            .map(ac => ({ id: ac.moduleName, name: ac.moduleName }));
    }, [appCodes, selectedAppCodeName]);

    // Auto-select first module when project changes
    useEffect(() => {
        if (selectedAppCodeName && derivedModules.length > 0) {
            const isCurrentModuleValid = derivedModules.some(m => m.name === selectedModuleName);
            if (!isCurrentModuleValid) {
                const firstModule = derivedModules[0].name;
                setSelectedModuleName(firstModule);
            }
        } else if (!selectedAppCodeName) {
            setSelectedModuleName('');
        }
    }, [selectedAppCodeName, derivedModules, selectedModuleName]);

    // Sync selectedAppCode (the ID) with the name/module selection
    useEffect(() => {
        if (selectedAppCodeName && selectedModuleName) {
            const found = appCodes.find(ac =>
                ac.projectName === selectedAppCodeName &&
                ac.moduleName === selectedModuleName
            );
            if (found) {
                if (selectedAppCode !== found.id) {
                    setSelectedAppCode(found.id);
                }
            } else {
                if (selectedAppCode !== '') setSelectedAppCode('');
            }
        } else {
            if (selectedAppCode !== '') setSelectedAppCode('');
        }
    }, [selectedAppCodeName, selectedModuleName, appCodes, selectedAppCode]);

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
                const { getAllAppCodes } = await import('../services/apiservice');
                const data = await getAllAppCodes(user.token);
                if (!data || !Array.isArray(data)) {
                    console.warn("getAllAppCodes returned non-array data:", data);
                    setAllHierarchyData([]);
                    setAppCodes([]);
                    return;
                }
                setAllHierarchyData(data);
                const mappedCodes = data.map((item) => {
                    const resolvedAppCode = (String(item.appCode || item.projectName || item.name || '')).trim();
                    return {
                        id: item.id || `${resolvedAppCode}-${item.moduleName}`,
                        projectName: resolvedAppCode,
                        moduleName: (String(item.moduleName || '')).trim(),
                        projectId: item.projectID || item.projectId || item.id,
                        appCode: resolvedAppCode,
                        description: item.description || '',
                        collections: item.collections || []
                    };
                }).sort((a, b) => {
                    const appA = a.appCode.toUpperCase();
                    const appB = b.appCode.toUpperCase();
                    if (appA < appB) return -1;
                    if (appA > appB) return 1;

                    const modA = a.moduleName.toUpperCase();
                    const modB = b.moduleName.toUpperCase();
                    return modA.localeCompare(modB);
                });
                setAppCodes(mappedCodes);
            } catch (error) {
                console.error('Failed to fetch app codes:', error);
            }
        }
    };

    const fetchCollectionDetailsForAdmin = async () => {
        if (user) {
            setIsLoadingCollections(true);
            try {
                const { getCollectionDetails } = await import('../services/apiservice');
                const data = await getCollectionDetails([], user.token);
                if (!data || !Array.isArray(data)) {
                    console.warn("getCollectionDetails returned non-array data:", data);
                    setAllHierarchyData([]);
                    setAppCodes([]);
                    return;
                }
                setAllHierarchyData(data);
                const mappedCodes = data.map((item) => {
                    const resolvedAppCode = (String(item.appCode || item.projectName || item.name || '')).trim();
                    return {
                        id: item.id || `${resolvedAppCode}-${item.moduleName}`,
                        projectName: resolvedAppCode,
                        moduleName: (String(item.moduleName || '')).trim(),
                        projectId: item.projectId || item.id,
                        appCode: resolvedAppCode,
                        description: item.description || '',
                        collections: item.collections || []
                    };
                }).sort((a, b) => {
                    const appA = a.appCode.toUpperCase();
                    const appB = b.appCode.toUpperCase();
                    if (appA < appB) return -1;
                    if (appA > appB) return 1;

                    const modA = a.moduleName.toUpperCase();
                    const modB = b.moduleName.toUpperCase();
                    return modA.localeCompare(modB);
                });
                setAppCodes(mappedCodes);
            } catch (error) {
                console.error('Failed to fetch collection details for admin:', error);
            } finally {
                setIsLoadingCollections(false);
            }
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchUsers();
        fetchAppCodes();
        fetchEnvironments();
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
                            ? (pid.projectId || pid.id || pid.appCode)
                            : pid;

                        // Find matching code in hierarchy (loose equality for string/number match)
                        const found = allHierarchyData.find(h =>
                            h.projectId == searchId ||
                            (h.appCode && String(h.appCode).trim().toUpperCase() === String(searchId).trim().toUpperCase()) ||
                            (h.projectName && String(h.projectName).trim().toUpperCase() === String(searchId).trim().toUpperCase()) ||
                            h.id == searchId
                        );

                        if (found) {
                            const resolvedAppCode = (String(found.appCode || found.projectName || found.name || '')).trim();
                            return {
                                ...found,
                                id: found.id || `${resolvedAppCode}-${found.moduleName}`,
                                projectName: resolvedAppCode,
                                moduleName: found.moduleName
                            };
                        }
                        return null;
                    }).filter(Boolean).sort((a, b) => {
                        const appA = (a.appCode || a.projectName || '').trim().toUpperCase();
                        const appB = (b.appCode || b.projectName || '').trim().toUpperCase();
                        if (appA < appB) return -1;
                        if (appA > appB) return 1;
                        return (a.moduleName || '').trim().toUpperCase().localeCompare((b.moduleName || '').trim().toUpperCase());
                    });

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
        handleRefreshView(activeView);
    }, [activeView]);

    const handleRefreshView = (view) => {
        if (view === 'appcodes') {
            fetchCollectionDetailsForAdmin();
        } else if (view === 'manageAppCodes') {
            fetchAppCodes();
        } else if (view === 'users') {
            fetchUsers();
            fetchAppCodes();
        } else if (view === 'environments') {
            if (appCodes.length === 0) {
                fetchAppCodes();
            }
            fetchEnvironments();
        }
    };

    // Auto-fetch environments when selection changes
    useEffect(() => {
        if (activeView === 'environments' && selectedAppCodeName && selectedModuleName) {
            fetchEnvironments();
        }
    }, [selectedAppCodeName, selectedModuleName, activeView, appCodes]);

    // Auto-select first project/module if empty
    useEffect(() => {
        if (activeView === 'environments' && derivedProjects.length > 0 && !selectedAppCodeName) {
            setSelectedAppCodeName(derivedProjects[0].id);
        }
    }, [activeView, derivedProjects, selectedAppCodeName]);

    useEffect(() => {
        if (activeView === 'environments' && selectedAppCodeName && derivedModules.length > 0 && !selectedModuleName) {
            setSelectedModuleName(derivedModules[0].id);
        }
    }, [activeView, selectedAppCodeName, derivedModules, selectedModuleName]);

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
                password: "login@1234",
                role: newUserRole,
                status: "RESETPASSWORD",
                profileImage: profileImageData
            };

            // Dynamically import register to avoid top-level dependency issues if any
            const { register } = await import('../services/apiservice');
            await register(userData);

            // Clear inputs and close modal
            setNewUsername('');
            setNewUserRole('user');
            setIsCreatingUser(false);

            // Show success message FIRST
            alert(`User ${userData.username} created successfully!`);

            // Refresh user list from server AFTER alert is dismissed
            await fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert(`Error creating user: ${error.message}`);
        }
    };

    const handleCreateAppCode = async (e) => {
        e.preventDefault();

        try {
            // Dynamically import to avoid circular dependencies/initialization issues
            const { createUpdateProject } = await import('../services/apiservice');

            const projectPayload = {
                id: editingAppCodeId || null,
                appCode: newAppCode,
                moduleName: newModuleName,
                description: newDescription
            };

            await createUpdateProject(projectPayload, user?.token);

            // Success handling
            alert(`App Code ${newAppCode} - ${newModuleName} ${editingAppCodeId ? 'updated' : 'created'} successfully!`);

            // Clear form
            setNewAppCode('');
            setNewModuleName('');
            setNewDescription('');
            setEditingAppCodeId(null);
            setIsCreatingAppCode(false);

            // Refresh list
            await fetchAppCodes();

        } catch (error) {
            console.error('Failed to create/update app code:', error);
            const backendMsg = error.response?.data?.data?.message || error.message;
            alert(`Error creating/updating app code: ${backendMsg}`);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                const { deleteProject } = await import('../services/apiservice');
                await deleteProject(projectId, user?.token);
                await fetchAppCodes();
                alert('Project deleted successfully');
            } catch (error) {
                console.error('Failed to delete project:', error);
                alert('Error deleting project: ' + error.message);
            }
        }
    };

    const handleEditProject = (project) => {
        console.log("handleEditProject", project);
        setNewAppCode(project.appCode || '');
        setNewModuleName(project.moduleName || '');
        setNewDescription(project.description || '');
        setEditingAppCodeId(project.projectId);
        setAppCodeModalTab('users');
        setIsCreatingAppCode(true);
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
            const projectObj = (editingUserProjectDetails || [])
                .find(ac => (ac.id === appCodeId || ac.appCode === appCodeId || String(ac.projectId) === String(appCodeId))) ||
                (userInState?.assignedAppCodes || [])
                    .find(ac => (ac.id === appCodeId || ac.appCode === appCodeId || String(ac.projectId) === String(appCodeId)));

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
                    return { ...u, assignedAppCodes: (u.assignedAppCodes || []).filter(ac => (ac.id || ac.appCode) !== appCodeId) };
                }
                return u;
            }));

            if (editingUser && editingUser.id === userId) {
                setEditingUserProjectDetails(prev => prev.filter(ac => (ac.id || ac.appCode) !== appCodeId));
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
        // Map assigned project IDs (usually numeric IDs stored in 'id' property)
        const assignedIds = (user.assignedAppCodes || []).filter(Boolean).map(ac => String(ac.id));
        // Filter out appCodes that are already assigned by comparing against projectId (the numeric ID)
        return (appCodes || []).filter(ac => !assignedIds.includes(String(ac.projectId)));
    };

    const handleUpdateUserStatus = async (userId, newStatus) => {
        setShowUserStatusSuccess(false);
        try {
            const { updateUser } = await import('../services/apiservice');
            const validUserId = parseInt(userId, 10);
            if (isNaN(validUserId)) {
                alert('Error: Invalid User ID.');
                return;
            }
            if (newStatus == 'RESETPASSWORD') {
                await updateUser({ id: validUserId, status: newStatus, userStatus: newStatus, passwordDetails: "login@123" }, user?.token);
            } else {
                await updateUser({ id: validUserId, status: newStatus, userStatus: newStatus }, user?.token);
            }

            // Update local state immediately for both the table and editing modal
            setUsers(prevUsers => prevUsers.map(u =>
                (u.id === validUserId || u.id == userId || u.userId === validUserId || u.userId == userId)
                    ? { ...u, userStatus: newStatus }
                    : u
            ));

            if (editingUser && (editingUser.id === validUserId || editingUser.userId === validUserId || editingUser.id == userId || editingUser.userId == userId)) {
                setEditingUser(prev => ({ ...prev, userStatus: newStatus }));
            }

            // Refresh from server to ensure sync
            await fetchUsers();

            // Show persistent success message in the modal
            setShowUserStatusSuccess(true);
            // We'll leave it visible until the modal is closed for "staying" effect

            // Keep the alert for unambiguous confirmation

        } catch (error) {
            console.error('Failed to update status:', error);
            const backendMsg = error.response?.data?.data?.message || error.response?.data?.data?.error || error.message;
            alert(`Error updating status: ${backendMsg}`);
        }

    };

    const handleToggleUserStatus = (userId) => {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
            const nextStatus = targetUser.userStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            handleUpdateUserStatus(userId, nextStatus);
        }
    };

    const handleEditUser = async (userToEdit) => {
        console.log("userToEdit", userToEdit);
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

                // Only set details if we are still editing the same user
                setEditingUser(current => {
                    if (current && (current.userId === userId || current.id === userId)) {
                        setEditingUserProjectDetails(details || []);
                    }
                    return current;
                });
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

            <Layout activeView={activeView} setActiveView={setActiveView} onRefresh={handleRefreshView}>
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
                ) : activeView === 'environments' ? (
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-80 border-r border-slate-200 dark:border-[var(--border-color)] p-6 overflow-auto bg-white dark:bg-[var(--bg-secondary)]">
                            <EnvironmentManager
                                environments={environments}
                                activeEnv={activeEnv}
                                setActiveEnv={setActiveEnv}
                                readOnly={true}
                                projects={derivedProjects}
                                activeAppCode={selectedAppCodeName}
                                onAppCodeSelect={setSelectedAppCodeName}
                                onRefreshAppCode={refreshAppCode}
                                modules={derivedModules}
                                activeModule={selectedModuleName}
                                onModuleSelect={setSelectedModuleName}
                                onRefreshModule={refreshModule}
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
                                            <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">Review environment variables for this project. Admins have read-only access.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200 dark:border-[var(--border-color)] shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 dark:border-[var(--border-color)] bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-[var(--text-secondary)]">Variables</span>
                                            <div className="relative w-64">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search variables..."
                                                    value={envSearchTerm}
                                                    onChange={(e) => setEnvSearchTerm(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs outline-none focus:border-red-500/50 transition-all dark:text-white"
                                                />
                                                {envSearchTerm && (
                                                    <button
                                                        onClick={() => setEnvSearchTerm('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex flex-col border border-slate-200 dark:border-[var(--border-color)] rounded-lg overflow-hidden bg-white dark:bg-[var(--bg-surface)]">
                                                <div className="flex border-b border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <div className="flex-1 p-2 border-r border-slate-200 dark:border-[var(--border-color)]">Key</div>
                                                    <div className="flex-1 p-2">Value</div>
                                                </div>
                                                {(environments.find(e => e.id === activeEnv)?.variables || [])
                                                    .filter(pair =>
                                                        (pair.key || '').toLowerCase().includes(envSearchTerm.toLowerCase()) ||
                                                        (pair.value || '').toLowerCase().includes(envSearchTerm.toLowerCase())
                                                    )
                                                    .map((pair, idx) => (
                                                        <div key={idx} className="flex border-b border-slate-200 dark:border-[var(--border-color)] last:border-0 group">
                                                            <div className="flex-1 p-2 text-sm border-r border-slate-200 dark:border-[var(--border-color)] font-mono text-slate-500 dark:text-slate-400 select-all">
                                                                {pair.key || <span className="italic opacity-50">Empty key</span>}
                                                            </div>
                                                            <div className="flex-1 p-2 text-sm font-mono text-slate-900 dark:text-[var(--text-primary)] select-all">
                                                                {pair.value || <span className="italic opacity-50">Empty value</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                {((environments.find(e => e.id === activeEnv)?.variables || []).length === 0) && (
                                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                                        No variables defined in this environment.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-red-500/20">
                                        <Globe className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Environment Selected</h3>
                                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Select an environment from the sidebar to view its configuration.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">

                            {activeView === 'users' && (
                                <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                                    {/* Left Side: App Codes */}
                                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1">
                                            <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">App Codes</h2>
                                                    <div className="relative flex-1 max-w-[200px]">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search codes..."
                                                            value={appCodeSearchTerm}
                                                            onChange={(e) => setAppCodeSearchTerm(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-7 py-1 text-[10px] outline-none focus:border-red-500/50 transition-all"
                                                        />
                                                        {appCodeSearchTerm && (
                                                            <button
                                                                onClick={() => setAppCodeSearchTerm('')}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                                            >
                                                                <X className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setNewAppCode('');
                                                        setNewModuleName('');
                                                        setNewDescription('');
                                                        setEditingAppCodeId(null);
                                                        setAppCodeModalTab('details');
                                                        setIsCreatingAppCode(true);
                                                    }}
                                                    className="bg-red-600 text-white px-3 py-1.5 rounded text-[11px] hover:bg-red-700 font-bold shadow-sm transition-all active:scale-95 shrink-0"
                                                >
                                                    CREATE
                                                </button>
                                            </div>
                                            <div className="overflow-auto flex-1">
                                                <table className="w-full text-left text-sm table-fixed">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[25%] text-center">App Code</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[25%] text-center">Modules</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[25%] text-center">Users</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[25%] text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {filteredAppCodesWithUserCounts.map(code => (
                                                            <tr key={code.id || code.projectId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-3 py-2 font-medium text-[11px] truncate text-center" title={code.appCode}>{code.appCode}</td>
                                                                <td className="px-3 py-2 text-[11px] text-center text-slate-500 dark:text-slate-400 truncate" title={code.moduleName}>{code.moduleName}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                                        {code.userCount || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center space-x-1 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => handleEditProject(code)}
                                                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-[10px] px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProject(code.projectId)}
                                                                        className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-[10px] px-2 py-1 border border-red-100 dark:border-red-900/30 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
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

                                    {/* Right Side: Users */}
                                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1">
                                            <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">Users</h2>
                                                    <div className="relative flex-1 max-w-[200px]">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search users..."
                                                            value={userSearchTerm}
                                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-7 py-1 text-[10px] outline-none focus:border-red-500/50 transition-all"
                                                        />
                                                        {userSearchTerm && (
                                                            <button
                                                                onClick={() => setUserSearchTerm('')}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                                            >
                                                                <X className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setIsCreatingUser(true)}
                                                    className="bg-red-600 text-white px-3 py-1.5 rounded text-[11px] hover:bg-red-700 font-bold shadow-sm transition-all active:scale-95 shrink-0"
                                                >
                                                    CREATE
                                                </button>
                                            </div>
                                            <div className="overflow-auto flex-1">
                                                <table className="w-full text-left text-sm table-fixed">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[20%] text-center">User Name</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[20%] text-center">Role</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[20%] text-center">Status</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[20%] text-center">Codes</th>
                                                            <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-[11px] w-[20%] text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {filteredUsers.map(u => (
                                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-3 py-1.5">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                                            {(u.userProfileImage && u.userProfileImage.length > 30) || (u.profileImage && u.profileImage.length > 30) ? (
                                                                                <img
                                                                                    src={u.userProfileImage || u.profileImage}
                                                                                    alt=""
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-slate-500">{(u.userName || u.username || 'U')?.substring(0, 1).toUpperCase()}</span>
                                                                            )}
                                                                        </div>
                                                                        <span className="font-medium text-[11px] truncate" title={u.userName}>{u.userName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 capitalize text-center truncate">{u.userRole?.toLowerCase()}</td>
                                                                <td className="px-3 py-1.5 text-center">
                                                                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-tight ${u.userStatus === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                        u.userStatus === 'DISABLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                        }`}>
                                                                        {u.userStatus}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-1.5 text-center">
                                                                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                                        {u.projectCount}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-1.5 text-center space-x-1 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => handleEditUser(u)}
                                                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-[10px] px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                        title="Edit Access"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setAssigningUser(u);
                                                                            setSelectedAppCodeId('');
                                                                            setAssignAppCodeName('');
                                                                            setAssignModuleName('');
                                                                        }}
                                                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-[10px] px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                        title="Add App Code"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u.id)}
                                                                        className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-[10px] px-1.5 py-0.5 border border-red-100 dark:border-red-900/30 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                                        title="Delete User"
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
                                </div>
                            )}

                            {activeView === 'appcodes' && (
                                <div className="flex flex-col gap-4 h-full">
                                    {/* App Code Selector */}
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">


                                                {/* Project Dropdown */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Project:</span>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedAppCodeName}
                                                            onChange={(e) => setSelectedAppCodeName(e.target.value)}
                                                            className="w-48 appearance-none border rounded-md px-1.5 py-1 text-sm dark:bg-slate-900 dark:border-slate-700 focus:border-red-500 outline-none cursor-pointer"
                                                        >
                                                            <option value="">-- Select Project --</option>
                                                            {[...new Set(appCodes.map(ac => ac.projectName))].map(projName => (
                                                                <option key={projName} value={projName}>
                                                                    {projName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Module Dropdown */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Module:</span>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedModuleName}
                                                            onChange={(e) => setSelectedModuleName(e.target.value)}
                                                            className="w-48 appearance-none border rounded-md px-1.5 py-1 text-sm dark:bg-slate-900 dark:border-slate-700 focus:border-red-500 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!selectedAppCodeName}
                                                        >
                                                            <option value="">-- Select Module --</option>
                                                            {appCodes
                                                                .filter(ac => ac.projectName === selectedAppCodeName)
                                                                .map(ac => (
                                                                    <option key={ac.moduleName} value={ac.moduleName}>
                                                                        {ac.moduleName}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Search Input */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    <div className="relative w-64">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search collections or requests..."
                                                            value={collectionSearchTerm}
                                                            onChange={(e) => setCollectionSearchTerm(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md pl-8 pr-8 py-1 text-sm outline-none focus:border-red-500/50 transition-all dark:text-white"
                                                        />
                                                        {collectionSearchTerm && (
                                                            <button
                                                                onClick={() => setCollectionSearchTerm('')}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Collections Table */}
                                    {/* Split Content: Table and Details */}
                                    {selectedAppCode && (
                                        <div className="flex flex-1 gap-4 min-h-0">
                                            {/* LEFT SIDE: Collections Table */}
                                            <div className="w-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-0">
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
                                                        <table className="w-full text-left text-sm table-fixed">
                                                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                                                <tr>
                                                                    <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 w-10"></th>
                                                                    <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 w-7/12">Name</th>
                                                                    <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 w-3/12">Method</th>
                                                                    <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 w-2/12 text-right"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                                {appCodeCollections
                                                                    .filter(col => {
                                                                        const term = collectionSearchTerm.toLowerCase();
                                                                        if (!term) return true;
                                                                        const colMatch = col.name.toLowerCase().includes(term);
                                                                        const reqMatch = col.requests?.some(req =>
                                                                            req.name.toLowerCase().includes(term) ||
                                                                            req.method.toLowerCase().includes(term)
                                                                        );
                                                                        return colMatch || reqMatch;
                                                                    })
                                                                    .map(collection => {
                                                                        const filteredRequests = collectionSearchTerm
                                                                            ? collection.requests?.filter(req =>
                                                                                req.name.toLowerCase().includes(collectionSearchTerm.toLowerCase()) ||
                                                                                req.method.toLowerCase().includes(collectionSearchTerm.toLowerCase())
                                                                            )
                                                                            : collection.requests;

                                                                        const isExpanded = expandedCollections.has(collection.collectionId) || !!collectionSearchTerm;

                                                                        return (
                                                                            <Fragment key={collection.collectionId}>
                                                                                {/* Collection Row */}
                                                                                <tr className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                                                                                    <td className="px-4 py-2">
                                                                                        <button
                                                                                            onClick={() => toggleCollection(collection.collectionId)}
                                                                                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                                                        >
                                                                                            {isExpanded ? (
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                                                            ) : (
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                                                            )}
                                                                                        </button>
                                                                                    </td>
                                                                                    <td className="px-4 py-2 font-bold text-slate-900 dark:text-white" colSpan="3">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500/70"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                                                                                            {collection.name}
                                                                                            <span className="ml-2 text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 font-medium">
                                                                                                {filteredRequests?.length || 0}
                                                                                            </span>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>

                                                                                {/* Request Rows (if expanded) */}
                                                                                {isExpanded && filteredRequests?.map((request, reqIdx) => {
                                                                                    const reqId = request.requestId || request.id || `req-${reqIdx}`;
                                                                                    const isSelected = selectedRequest && (selectedRequest.requestId === reqId || selectedRequest.id === reqId);

                                                                                    return (
                                                                                        <tr
                                                                                            key={reqId}
                                                                                            className={cn(
                                                                                                "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group",
                                                                                                isSelected && "bg-red-50 dark:bg-red-900/10 border-l-2 border-red-500"
                                                                                            )}
                                                                                            onClick={() => handleRequestClick(request)}
                                                                                        >
                                                                                            <td className="px-4 py-3"></td>
                                                                                            <td className="px-4 py-2 pl-10">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-500 transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                                                                    <span className={cn(
                                                                                                        "text-[13px]",
                                                                                                        isSelected ? "font-bold text-red-600" : "text-slate-600 dark:text-slate-300"
                                                                                                    )}>
                                                                                                        {request.name || 'Untitled Request'}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2">
                                                                                                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-black rounded border ${request.method === 'GET' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30' :
                                                                                                    request.method === 'POST' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/10 dark:text-yellow-400 dark:border-yellow-800/30' :
                                                                                                        request.method === 'PUT' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30' :
                                                                                                            request.method === 'DELETE' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30' :
                                                                                                                'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/30'
                                                                                                    }`}>
                                                                                                    {request.method || 'GET'}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-right">
                                                                                                <ChevronDown className={cn("inline-block w-4 h-4 text-slate-300 transition-transform", isSelected && "-rotate-90 text-red-500")} />
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </Fragment>
                                                                        )
                                                                    })
                                                                }
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT SIDE: Request Details (View Mode) */}
                                            <div className="w-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                                                {selectedRequest ? (
                                                    <div className="flex flex-col h-full">
                                                        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[10px] font-black border",
                                                                    selectedRequest.method === 'GET' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20' :
                                                                        selectedRequest.method === 'POST' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20' :
                                                                            'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20'
                                                                )}>
                                                                    {selectedRequest.method || 'GET'}
                                                                </span>
                                                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{selectedRequest.name || 'Untitled'}</h3>
                                                            </div>
                                                            <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group">
                                                                <span className="text-slate-400 group-hover:text-red-500 text-lg leading-none">×</span>
                                                            </button>
                                                        </div>
                                                        <div className="p-6 overflow-y-auto flex-1">
                                                            <div className="space-y-6">
                                                                {/* URL */}
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint URL</label>
                                                                    <div className="relative">
                                                                        <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 break-all text-slate-600 dark:text-slate-300">
                                                                            {String(selectedRequest.url || 'No URL specified')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Headers */}
                                                                {(() => {
                                                                    let headers = selectedRequest.headers;
                                                                    if (typeof headers === 'string') {
                                                                        try { headers = JSON.parse(headers); } catch (e) { headers = {}; }
                                                                    }
                                                                    if (headers && typeof headers === 'object' && !Array.isArray(headers) && Object.keys(headers).length > 0) {
                                                                        return (
                                                                            <div>
                                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Headers</label>
                                                                                <div className="bg-white dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden text-[11px]">
                                                                                    <table className="w-full">
                                                                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                                                            <tr>
                                                                                                <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-tighter">Key</th>
                                                                                                <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-tighter">Value</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                            {Object.entries(headers || {}).filter(([k]) => k).map(([key, value]) => (
                                                                                                <tr key={key}>
                                                                                                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-400">{String(key)}</td>
                                                                                                    <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-500">{String(value)}</td>
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
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Body</label>
                                                                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                                                                            <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap break-words overflow-x-auto selection:bg-green-500/20">
                                                                                {typeof selectedRequest.body === 'string' ? selectedRequest.body : JSON.stringify(selectedRequest.body, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-sm p-8 text-center bg-slate-50/30 dark:bg-slate-900/10">
                                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 animate-pulse opacity-20" />
                                                        </div>
                                                        <h4 className="text-slate-900 dark:text-white font-bold not-italic mb-1">No Request Selected</h4>
                                                        <p className="text-xs max-w-[200px]">Select a request from the left table to view its full configuration and data.</p>
                                                    </div>
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
                            <h3 className="font-bold">Edit Access<span className="ml-3 text-slate-600 dark:text-slate-400 font-medium">{editingUser.userName || editingUser.username}</span></h3>
                            <button onClick={() => { setEditingUser(null); setShowUserStatusSuccess(false); fetchUsers(); }} className="text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">User Status</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Affects immediate login access</span>
                            </div>
                            <select
                                value={editingUser.userStatus || 'active'}
                                onChange={(e) => handleUpdateUserStatus(editingUser.id, e.target.value)}
                                className="text-xs font-black bg-slate-50 dark:bg-slate-900 text-red-600 border border-slate-100 dark:border-slate-700 rounded-md px-4 py-2 outline-none transition-all cursor-pointer shadow-sm hover:shadow-md appearance-none min-w-[140px] text-center"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="PENDING">PENDING</option>
                                <option value="DISABLED">DISABLED</option>
                                <option value="RESETPASSWORD">RESET PASSWORD</option>
                            </select>
                        </div>
                        {showUserStatusSuccess && (
                            <div className="px-6 py-2 bg-green-50 dark:bg-green-900/20 flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200 border-b border-green-100 dark:border-green-900/30">
                                <Check className="w-3 h-3" />
                                Status updated successfully
                            </div>
                        )}

                        <div className="p-6">
                            <h4 className="text-sm font-semibold mb-3 text-slate-600 dark:text-slate-400">Assigned App Codes</h4>

                            {isFetchingProjectDetails ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                </div>
                            ) : (editingUserProjectDetails.length > 0 || (users.find(u => u.id === editingUser.id)?.assignedAppCodes.length > 0)) ? (
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {/* Show fetched details if available, otherwise fallback to existing assignedAppCodes */}
                                    {(editingUserProjectDetails.length > 0 ? editingUserProjectDetails : users.find(u => u.id === editingUser.id)?.assignedAppCodes || [])
                                        .sort((a, b) => {
                                            const appA = (a.projectName || a.appCode || '').trim().toUpperCase();
                                            const appB = (b.projectName || b.appCode || '').trim().toUpperCase();
                                            if (appA < appB) return -1;
                                            if (appA > appB) return 1;
                                            return (a.moduleName || '').trim().toUpperCase().localeCompare((b.moduleName || '').trim().toUpperCase());
                                        })
                                        .map((ac, index) => (
                                            <li key={ac.id ? `id-${ac.id}` : `pc-${ac.appCode}-${ac.moduleName || index}`} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700 text-sm">
                                                <div>
                                                    <div className="font-medium">{ac.projectName || ac.appCode}</div>
                                                    <div className="text-xs text-slate-500">{ac.moduleName || ac.description}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassignAppCode(editingUser.id, ac.id || ac.appCode)}
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
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 text-right flex justify-center">

                            <button onClick={() => { setEditingUser(null); setShowUserStatusSuccess(false); fetchUsers(); }} className="bg-red-600 text-white px-8 py-2 rounded text-sm hover:bg-red-700 font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add App Code Modal */}
            {assigningUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-sm">Assign App Code<span className="ml-9 text-slate-600 dark:text-slate-400">{assigningUser.userName || assigningUser.username}</span></h3>
                            <button onClick={() => setAssigningUser(null)} className="text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        {/* <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 mb-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Assignment</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Select a project and module to grant access</span>
                            </div>
                        </div> */}
                        <br></br>
                        <div className="px-6 pb-6">
                            <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-600 dark:text-slate-400">Project</label>
                            <select
                                value={assignAppCodeName}
                                onChange={e => {
                                    setAssignAppCodeName(e.target.value);
                                    setAssignModuleName('');
                                    setSelectedAppCodeId('');
                                }}
                                className="w-full border rounded-md p-3 text-sm dark:bg-slate-900 dark:border-slate-700 mb-5 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            >
                                <option value="">-- Select Project --</option>
                                {[...new Set(getUnassignedCodes(users.find(u => u.id === assigningUser.id)).map(ac => ac.projectName))].map(proj => (
                                    <option key={proj} value={proj}>{proj}</option>
                                ))}
                            </select>

                            <label className="block text-xs font-bold mb-2 uppercase tracking-wide text-slate-600 dark:text-slate-400">Module</label>
                            <select
                                value={assignModuleName}
                                onChange={e => {
                                    const val = e.target.value;
                                    setAssignModuleName(val);
                                    const unassigned = getUnassignedCodes(users.find(u => u.id === assigningUser.id));
                                    const match = unassigned.find(ac => ac.projectName === assignAppCodeName && ac.moduleName === val);
                                    setSelectedAppCodeId(match ? match.id : '');
                                }}
                                className="w-full border rounded-md p-3 text-sm dark:bg-slate-900 dark:border-slate-700 mb-8 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                disabled={!assignAppCodeName}
                            >
                                <option value="">-- Select Module --</option>
                                {getUnassignedCodes(users.find(u => u.id === assigningUser.id))
                                    .filter(ac => ac && ac.projectName === assignAppCodeName)
                                    .map(ac => (
                                        <option key={ac.moduleName} value={ac.moduleName}>{ac.moduleName}</option>
                                    ))
                                }
                            </select>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button
                                    onClick={() => setAssigningUser(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 uppercase tracking-tight transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignAppCode}
                                    disabled={!selectedAppCodeId}
                                    className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
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
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingAppCodeId ? 'Edit App Code' : 'Create New App Code'}</h3>
                            <button onClick={() => setIsCreatingAppCode(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
                        </div>
                        <form onSubmit={handleCreateAppCode} className="flex flex-col flex-1 min-h-0">
                            {editingAppCodeId && (
                                <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setAppCodeModalTab('users')}
                                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${appCodeModalTab === 'users'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        Users ({assignedUsers.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAppCodeModalTab('details')}
                                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${appCodeModalTab === 'details'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        Details
                                    </button>
                                </div>
                            )}

                            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                {(!editingAppCodeId || appCodeModalTab === 'details') ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400 uppercase tracking-tight">APP Code</label>
                                            <input
                                                type="text"
                                                value={newAppCode}
                                                onChange={e => setNewAppCode(e.target.value)}
                                                className="w-full border rounded-lg p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                                required
                                                placeholder="e.g. GAPI-CB-SG"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400 uppercase tracking-tight">Module Name</label>
                                            <input
                                                type="text"
                                                value={newModuleName}
                                                onChange={e => setNewModuleName(e.target.value)}
                                                className="w-full border rounded-lg p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                                required
                                                placeholder="CASA, FD, LOAN etc"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400 uppercase tracking-tight">Description</label>
                                            <textarea
                                                value={newDescription}
                                                onChange={e => setNewDescription(e.target.value)}
                                                className="w-full border rounded-lg p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px]"
                                                placeholder="Project description..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className={assignedUsers.length >= 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center" : "space-y-3"}>
                                        {assignedUsers.length > 0 ? (
                                            assignedUsers.map(u => (
                                                <div key={u.id} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-all group hover:border-red-100 dark:hover:border-red-900/30 w-full max-w-[200px]">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-red-600 dark:text-red-400 shrink-0 overflow-hidden">
                                                            {(u.userProfileImage || u.profileImage) ? (
                                                                <img src={u.userProfileImage || u.profileImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                (u.userName || u.username || 'U').charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {u.userName || u.username}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            await handleUnassignAppCode(u.id, editingAppCodeId);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100 shrink-0"
                                                        title="Unassign user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                    <UserIcon className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">No users assigned yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingAppCode(false)}
                                    className="px-6 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-bold uppercase tracking-tight transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-red-600 text-white px-8 py-2 rounded-lg text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    {editingAppCodeId ? 'Save Changes' : 'Create App Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
