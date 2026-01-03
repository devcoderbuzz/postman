import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';
// Setup Axios Interceptor for 403 handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            console.warn('Axios Interceptor: 403 Forbidden detected. Dispatching global logout.');
            window.dispatchEvent(new Event('auth-logout'));
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
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/login`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                username: username,
                password: password
            }
        });
        
        // The proxy returns { status, data, headers, ... }
        // If data.isError is true, it was a 4xx/5xx from the target
        if (response.data.isError) {
            console.error('Login Error 1233:', response.data.data.error);   
             throw new Error(response.data.data.error);
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error during login:', error.message);
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
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/register`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: userData
        });
        console.log('Register Response:', response.data);
        if (response.data.isError) {
             throw new Error(response.data.data?.error || response.data.statusText || 'Registration failed');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error during registration:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'GET',
            url: `${BASE_URL}/users/allusersWithProjectData`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                username: currentUser.username,
                role: currentUser.role,
                status: currentUser.status
                // Password is intentionally omitted for security, relying on Bearer token
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch users');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error fetching users:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'GET',
            url: `${BASE_URL}/projects/hierarchy`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch project hierarchy');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error fetching project hierarchy:', error.message);
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
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/update-password`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                username: username,
                currentPassword: oldPassword,
                newPassword: newPassword
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Password update failed');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error during password update:', error.message);
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
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/reset-password`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                userId: userId,
                username: userName,
                currentPassword: currentPassword,
                newPassword: newPassword,
                userStatus: 'ACTIVE'
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Activation failed');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error during user activation:', error.message);
        throw error;
    }
};


export const resetPassword = async (userId, userName, currentPassword,newPassword, token) => {
    try {
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/reset-password`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                userId: userId,
                username: userName,
                currentPassword: currentPassword,
                newPassword: newPassword
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Activation failed');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error during user activation:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/requests`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: requestData
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to create request');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error creating request:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/update-profile-pic`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                userId: userId,
                profileImage: profileImage
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to update profile picture');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error updating profile picture:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/projects/all`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: projectIds
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch project details');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error fetching project details:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/unassign-project`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                userId: userId,
                projectId: projectId
            }
        });
        
        if (response.data.isError) {
             // Debugging: Stringify the entire data to see what the error actually is
             const errorDetail = JSON.stringify(response.data.data || response.data);
             throw new Error(`Failed to unassign project. Server response: ${errorDetail}`);
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error unassigning project:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/assign-project`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                userId: userId,
                projectId: projectId
            }
        });
        
        if (response.data.isError) {
             // Debugging: Stringify the entire data to see what the error actually is
             const errorDetail = JSON.stringify(response.data.data.error || response.data);
             throw new Error(`Failed to assign project. Server response: ${errorDetail}`);
        }
        console.log('User assigned to Project successfully 124...', response.data.data.error);
        
        return response.data.data;
    } catch (error) {
        console.error('Error assigning project:', error.response?.data || error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/delete`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                id: userId
            }
        });
        
        if (response.data.isError) {
             const errorDetail = JSON.stringify(response.data.data || response.data);
             throw new Error(`Failed to delete user. Server response: ${errorDetail}`);
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error deleting user:', error.message);
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
        console.log('Updating User...', userDataObject, authToken);
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/users/update`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: userDataObject
        });
        
        if (response.data.isError) {
             const errorDetail = JSON.stringify(response.data.data || response.data);
             throw new Error(`Failed to update user status. Server response: ${errorDetail}`);
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error updating status:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/collections/create`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: collectionData
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to create/update collection');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error creating/updating collection:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/collections/delete`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                id: collectionId
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to delete collection');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error deleting collection:', error.message);
        throw error;
    }
};

/**
 * Get environment details.
 * Calls the /environments/search endpoint.
 * 
 * @param {string} token - Authorization token
 * @returns {Promise<any>} - The environment details
 */
export const getEnvDetails = async (token) => {
    try {
        const authToken = token || sessionStorage.getItem('authToken');
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/environments/search`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {}
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch environment details');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error fetching environment details:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/environments/update`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: envData
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to update environment details');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error updating environment details:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/projects/create`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: projectData
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to create/update project');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error creating/updating project:', error.message);
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
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/projects/delete`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                id: projectId
            }
        });
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to delete project');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Error deleting project:', error.message);
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

        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'GET',
            url: `${BASE_URL}/appCodes`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: [] // Empty array as body
        });

        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch app codes');
        }

        return response.data.data;
    } catch (error) {
        console.error('Error fetching app codes:', error.message);
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

        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/projects/projectCollectionDetails`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            data: projectIds
        });

        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Failed to fetch collection details');
        }

        return response.data.data;
    } catch (error) {
        console.error('Error fetching collection details:', error.message);
        throw error;
    }
};
