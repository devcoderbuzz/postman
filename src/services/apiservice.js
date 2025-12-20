import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

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
             throw new Error(response.data.data?.message || response.data.statusText || 'Login failed');
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
        
        if (response.data.isError) {
             throw new Error(response.data.data?.message || response.data.statusText || 'Registration failed');
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
            method: 'POST',
            url: `${BASE_URL}/users/project-count`,
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
 * Get App Codes and Modules service.
 * Calls the /projects/modules endpoint.
 * 
 * @param {Object} currentUser - The current logged-in user object
 * @returns {Promise<any>} - The list of app codes and modules
 */
export const getAppCodesAndModules = async (currentUser) => {
    try {
        const token = currentUser.token || sessionStorage.getItem('authToken');
        
        const response = await axios.post('http://localhost:3001/proxy', {
            method: 'POST',
            url: `${BASE_URL}/projects/modules`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                username: currentUser.username,
                password: currentUser.password || 'Password@1234',
                role: currentUser.role,
                status: currentUser.status
            }
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
export const activateUser = async (userId, newPassword, token) => {
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
                newPassword: newPassword,
                status: 'active'
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
