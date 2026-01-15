import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';
// Setup Axios Interceptor for 403 handling
// Setup Axios Interceptor for 403 handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            // Prevent global logout for specific non-critical endpoints or during debugging
            if (error.config && error.config.url && error.config.url.includes('/users/update')) {
                console.warn('Axios Interceptor: 403 Forbidden on update. Suppressing global logout for debugging.');
            } else {
                console.warn('Axios Interceptor: 403 Forbidden detected. Dispatching global logout.');
                window.dispatchEvent(new Event('auth-logout'));
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Login service to authenticate users.
 * 
 * @param {string} username - The username (e.g., "rajeev111")
 * @param {string} password - The password (e.g., "Password@1234")
 * @returns {Promise<any>} - The response data from the server
 */
export const login = async (username, password) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/login`, {
            username: username,
            password: password
        });
        return response.data;
    } catch (error) {
        console.error('Error during login:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.error || error.response.data.message || 'Login failed');
        }
        throw error;
    }
};

/**
 * Register service to create a new user.
 * 
 * @param {Object} userData - User data object
 * @param {string} userData.username
 * @param {string} userData.password
 * @param {string} userData.role
 * @param {string} userData.status
 * @param {string} userData.profileImage - Base64 encoded image
 * @returns {Promise<any>} - The response data
 */
export const register = async (userData) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/register`, userData);
        console.log('Register Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error during registration:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.error || error.response.data.message || 'Registration failed');
        }
        throw error;
    }
};

/**
 * Get all users service.
 * Calls the project-count endpoint which returns the list of users with their project counts.
 * 
 * @param {Object} currentUser - The current logged-in user object
 * @returns {Promise<any>} - The list of users
 */
export const getAllUsers = async (currentUser) => {
    try {
        const token = currentUser.token || sessionStorage.getItem('authToken');
        
        const response = await axios.get(`${BASE_URL}/users/allusersWithProjectData`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                username: currentUser.username,
                role: currentUser.role,
                status: currentUser.status
            }
        });
        
        console.log('All Users Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch users');
        }
        throw error;
    }
};


/**
 * Get All App Codes for Admin service.
 * Calls the /projects/hierarchy endpoint to get full hierarchy including collections.
 * 
 * @param {Object} currentUser - The current logged-in user object
 * @returns {Promise<any>} - The list of projects with hierarchy
 */
export const getAllAppCodesForAdmin = async (currentUser) => {
    try {
        const token = currentUser.token || sessionStorage.getItem('authToken');
        
        const response = await axios.get(`${BASE_URL}/projects/hierarchy`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching project hierarchy:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch project hierarchy');
        }
        throw error;
    }
};
/**
 * Update password service.
 * Calls the /users/update-password endpoint.
 * 
 * @param {string} username - The username
 * @param {string} oldPassword - The current password
 * @param {string} newPassword - The new password
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const updatePassword = async (username, oldPassword, newPassword, token) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/update-password`, {
            username: username,
            currentPassword: oldPassword,
            newPassword: newPassword
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error during password update:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Password update failed');
        }
        throw error;
    }
};

/**
 * Activate user service.
 * Calls the /users/reset-password endpoint.
 * 
 * @param {number} userId - The user ID
 * @param {string} newPassword - The new password
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const activateUser = async (userId,userName, currentPassword, newPassword, token) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/reset-password`, {
            userId: userId,
            username: userName,
            currentPassword: currentPassword,
            newPassword: newPassword,
            userStatus: 'ACTIVE'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error during user activation:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Activation failed');
        }
        throw error;
    }
};


export const resetPassword = async (userId, userName, currentPassword,newPassword, token) => {
    try {
        const response = await axios.post(`${BASE_URL}/users/reset-password`, {
            userId: userId,
            username: userName,
            currentPassword: currentPassword,
            newPassword: newPassword
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error during reset password:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Reset password failed');
        }
        throw error;
    }
};
/**
 * Create Request Data service.
 * Calls the /requests endpoint to create a new request.
 * 
 * @param {Object} requestData - The request data object
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data (created request)
 */
export const createRequestData = async (requestData, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/requests`, requestData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error creating request:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to create request');
        }
        throw error;
    }
};



/**
 * Update Profile Picture service.
 * Calls the /users/update-profile-pic endpoint.
 * 
 * @param {number} userId - The user ID
 * @param {string} profileImage - Base64 encoded image string
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const updateProfilePic = async (userId, profileImage, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        console.log('Calling updateProfilePic for user:', userId, 'Image data length:', profileImage?.length);
        
        const response = await axios.post(`${BASE_URL}/users/update-profile-pic`, {
            userId: userId,
            profileImage: profileImage
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('updateProfilePic Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating profile picture:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to update profile picture');
        }
        throw error;
    }
};

/**
 * Get Project Details service.
 * Calls the /projects/all endpoint with a list of project IDs.
 * 
 * @param {Array<number>} projectIds - Array of project IDs (e.g., [1, 2])
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The project details
 */
export const GetProjectDetails = async (projectIds, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/projects/all`, projectIds, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching project details:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch project details');
        }
        throw error;
    }
};

/**
 * Unassign user from project service.
 * Calls the /users/remove-project endpoint to unassign a project from a user.
 * 
 * @param {number} userId - The user ID
 * @param {number} projectId - The project ID
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const unassignUserFromProject = async (userId, projectId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/users/unassign-project`, {
            userId: userId,
            projectId: projectId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error unassigning project:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || error.response.data.error || 'Failed to unassign project');
        }
        throw error;
    }
};

/**
 * Assign user to project service.
 * Calls the /users/add-project endpoint to assign a project to a user.
 * 
 * @param {number} userId - The user ID
 * @param {number} projectId - The project ID
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const assignUserToProject = async (userId, projectId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        console.log('Assigning User to Project...', userId, projectId, authToken);
        
        const response = await axios.post(`${BASE_URL}/users/assign-project`, {
            userId: userId,
            projectId: projectId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('User assigned to Project successfully');
        return response.data;
    } catch (error) {
        console.error('Error assigning project:', error.response?.data || error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || error.response.data.error || 'Failed to assign project');
        }
        throw error;
    }
};

/**
 * Delete User service.
 * Calls the /users/delete endpoint to delete a user.
 * 
 * @param {number} userId - The user ID to delete
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const deleteUser = async (userId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/users/delete`, {
            id: userId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete user');
        }
        throw error;
    }
};

/**
 * Update User Status service.
 * Calls the /users/update-status endpoint to change a user's status.
 * 
 * @param {number} userId - The user ID
 * @param {string} status - The new status (e.g., 'active', 'inactive', 'pending')
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const updateUser = async (userDataObject, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('updateUser Error: No authentication token provided.');
            throw new Error('Authentication token is missing. Please log in again.');
        }

        const authHeader = `Bearer ${authToken}`;
        console.log('--- API Call: updateUser ---');
        console.log('Payload:', JSON.stringify(userDataObject, null, 2));
        
        const response = await axios.post(`${BASE_URL}/users/update`, userDataObject, {
            headers: {
                'Authorization': authHeader
            }
        });
        
        console.log('updateUser Success:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in updateUser:', error.response?.data || error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || error.response.data.error || 'Failed to update user');
        }
        throw error;
    }
};

// --- MIGRATED FROM api.js ---

export const getAllProjects = async () => {
    console.log('Fetching Projects...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([]);
      }, 600);
    });
};

export const getCollectionsByProjectId = async (projectId) => {
    console.log(`Fetching Collections for Project ${projectId}...`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([]);
      }, 500);
    });
};

/**
 * Create or Update Collections service.
 * Calls the /collections/create endpoint.
 * 
 * @param {Object} collectionData - The collection data object (matches the requested JSON structure)
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data (created/updated collection)
 */
export const createUpdateCollections = async (collectionData, token) => {
    console.log('Creating/Updating Collection...', collectionData);
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/collections/create`, collectionData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error creating/updating collection:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to create/update collection');
        }
        throw error;
    }
};

/**
 * Delete Collection service.
 * Calls the /collections/delete endpoint.
 * 
 * @param {number} collectionId - The ID of the collection to delete
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const deleteCollection = async (collectionId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        console.log('Deleting Collection...', collectionId);
        
        const response = await axios.post(`${BASE_URL}/collections/delete`, {
            id: collectionId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting collection:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete collection');
        }
        throw error;
    }
};



/**
 * Create or Update Project service.
 * Calls the /projects/create endpoint.
 * 
 * @param {Object} projectData - The project data object
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const createUpdateProject = async (projectData, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/projects/create`, projectData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error creating/updating project:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to create/update project');
        }
        throw error;
    }
};

/**
 * Delete Project service.
 * Calls the /projects/delete endpoint.
 * 
 * @param {number} projectId - The ID of the project to delete
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const deleteProject = async (projectId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/projects/delete`, {
            id: projectId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting project:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete project');
        }
        throw error;
    }
};

/**
 * Get all app codes.
 * Calls the /appCodes endpoint.
 *
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const getAllAppCodes = async (token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');

        const response = await axios.get(`${BASE_URL}/projects/appCodes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching app codes:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch app codes');
        }
        throw error;
    }
};

/**
 * Get collection details for specific project IDs.
 * Calls the /projects/projectCollectionDetails endpoint.
 *
 * @param {Array<number>} projectIds - Array of project IDs
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const getCollectionDetails = async (projectIds, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');

        const response = await axios.post(`${BASE_URL}/projects/projectCollectionDetails`, projectIds, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching collection details:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch collection details');
        }
        throw error;
    }
};


/**
 * Get environment details.
 * Calls the /environments endpoint with projectId.
 * 
 * @param {number} projectId - The project ID
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The environment details
 */
export const getEnvDetails = async (projectId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/environments/all`, projectId ? {
            projectId: projectId
        } : {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log("Environment details for project", projectId, ":", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching environment details:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to fetch environment details');
        }
        throw error;
    }
};

/**
 * Update environment details.
 * Calls the /environments/update endpoint.
 * 
 * @param {Object} envData - The environment data (envName and variables object)
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const updateEnvDetails = async (envData, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/environments/update`, envData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error updating environment details:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to update environment details');
        }
        throw error;
    }
};

/**
 * Delete environment details.
 * Calls the /environments/delete endpoint.
 * 
 * @param {number} envId - The environment ID
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const deleteEnvDetails = async (projectId, envName, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/environments/delete`, {
           project :{
            id: projectId,
           },
           envName: envName
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting environment details:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete environment details');
        }
        throw error;
    }
};

/**
 * Delete environment variable service.
 * Calls the /environments/variable/delete endpoint.
 * 
 * @param {number} variableId - The variable ID
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const deleteVariable = async (variableId, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post(`${BASE_URL}/environments/variable/delete`, {
            id: variableId
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting variable:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete variable');
        }
        throw error;
    }
};



/**
 * Create or Update environment variable service.
 * Calls the /environments/variable/update endpoint.
 * 
 * @param {Object} variableData - The variable data object (id, project, envName, variableKey, variableValue)
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const createUpdateEnvVariable = async (variableData, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        console.log("variableData", variableData);
        const response = await axios.post(`${BASE_URL}/environments/variable/update`, variableData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error updating variable:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to update variable');
        }
        throw error;
    }
};

/**
 * Rename environment service.
 * Calls the /environments/rename endpoint.
 * 
 * @param {number} projectId - The project ID
 * @param {string} oldEnvName - The current environment name
 * @param {string} newEnvName - The new environment name
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The response data
 */
export const renameEnv = async (projectId, oldEnvName, newEnvName, token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        // Construct query parameters
        const queryParams = new URLSearchParams({
            oldEnvName: oldEnvName,
            newEnvName: newEnvName,
            projectId: projectId
        }).toString();
        
        const response = await axios.post(`${BASE_URL}/environments/rename?${queryParams}`, {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error renaming environment:', error.message);
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to rename environment');
        }
        throw error;
    }
};
