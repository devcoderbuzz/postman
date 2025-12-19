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
