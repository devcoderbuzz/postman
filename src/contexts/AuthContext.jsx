import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for persisted session
        const storedUser = sessionStorage.getItem('user');
        const storedToken = sessionStorage.getItem('authToken');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser({ ...parsedUser, token: storedToken });
            } catch (e) {
                console.error('Failed to parse stored user', e);
                sessionStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // For now, we are relying on apiService.authenticate logic
        // But we also need to determine ROLE.
        // Since the backend might not return 'role' yet, we can mock it based on username for testing
        // or assume the backend returns it in the future.
        try {
            const data = await apiService.authenticate(username, password);
            if (data) {
                // MOCK ROLE ASSIGNMENT
                let role = data.role || 'developer';
                if (username.toLowerCase().includes('admin')) {
                    role = 'admin';
                } else if (username.toLowerCase().includes('user')) {
                    role = 'user';
                }

                const userData = {
                    username: data.username || username,
                    role: role,
                    token: data.token,
                    assignedAppCodes: data.assignedAppCodes || [] // Assuming backend returns this for users
                };
                console.log('Login successful. UserData:', userData);
                setUser(userData);
                sessionStorage.setItem('user', JSON.stringify(userData));
                sessionStorage.setItem('authToken', userData.token);
                return userData;
            }
            return null;
        } catch (err) {
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
