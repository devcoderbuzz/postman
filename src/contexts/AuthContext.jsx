import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { login as loginService } from '../services/apiservice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for persisted session
        const storedUser = sessionStorage.getItem('user');
        const storedToken = sessionStorage.getItem('authToken');

        if (storedUser && storedToken && storedUser !== 'undefined') {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && typeof parsedUser === 'object') {
                    setUser({ ...parsedUser, token: storedToken });
                }
            } catch (e) {
                console.error('Failed to parse stored user', e);
                sessionStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            // Call the apiservice login function
            const data = await loginService(username, password);

            if (data) {
                // Check status - if not active, give alert
                if (data.status && data.status.toLowerCase() !== 'active') {
                    alert('User account is not active. Please contact support.');
                    return null;
                }

                // Determine role. Backend might return it, or we use defaults for now.
                // Assuming backend returns 'role', otherwise fallback to mock logic.
                let role = data.role || 'user';
                if (username.toLowerCase().includes('admin')) {
                    role = 'admin';
                } else if (username.toLowerCase().includes('dev')) {
                    role = 'developer';
                }

                const userData = {
                    username: data.username || username,
                    role: role,
                    token: data.token || 'mock-token', // Backend should return token
                    assignedAppCodes: data.assignedAppCodes || []
                };

                console.log('Login successful. UserData:', userData);
                setUser(userData);
                sessionStorage.setItem('user', JSON.stringify(userData));
                sessionStorage.setItem('authToken', userData.token);
                if (data.profileImage) {
                    localStorage.setItem('profilePic', data.profileImage);
                }
                return userData;
            }
            return null;
        } catch (err) {
            console.error('Login error:', err);
            // Re-throw to allow component to handle error message
            throw err;
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
