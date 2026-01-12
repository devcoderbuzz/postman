import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService } from '../services/apiservice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setUser(null);
        sessionStorage.clear();
        localStorage.clear(); // Clear absolutely everything to prevent ghost data
        // Or if you want to be specific to avoid clearing unrelated site data:
        // ['profilePic', 'collections', 'environments', 'consoleHistory', 'localCollectionsPath', 'theme', 'layout'].forEach(k => localStorage.removeItem(k));
    };

    useEffect(() => {
        // Requirement 1: Logout on page refresh.
        // We explicitly clear any persisted session data instead of restoring it.
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        setUser(null);
        setLoading(false);

        // Requirement 2: Listen for 403 logout events from api service
        const handleAuthLogout = () => {
            console.warn('Received auth-logout event (403). Logging out...');
            logout();
        };

        window.addEventListener('auth-logout', handleAuthLogout);

        return () => {
            window.removeEventListener('auth-logout', handleAuthLogout);
        };
    }, []);

    const login = async (username, password) => {
        try {
            // Call the apiservice login function
            const data = await loginService(username, password);
            console.log('AuthContext login data:', data);

            if (data) {
                // Check status - if not active, give alert
                if (data.status && data.status.toLowerCase() === 'resetpassword') {
                    console.log('User needs password reset:', data);
                    return { ...data, needsReset: true };
                }



                // Determine role. Backend might return it, or we use defaults for now.
                // Assuming backend returns 'role', otherwise fallback to mock logic.
                let role = data.role || 'user';
                if (username.toLowerCase().includes('admin')) {
                    role = 'admin';
                } else if (username.toLowerCase().includes('dev')) {
                    role = 'developer';
                }

                const responseUser = data.user || data;
                const userId = responseUser.id || responseUser.userId || data.id || data.userId;

                const userData = {
                    username: responseUser.username || data.username || username,
                    id: userId || (username.toLowerCase() === 'admin' ? 1 : Date.now()),
                    role: responseUser.role || data.role || role,
                    status: responseUser.status || data.status,
                    token: data.token || responseUser.token || 'mock-token',
                    assignedAppCodes: responseUser.assignedAppCodes || data.assignedAppCodes || [],
                    projectIds: responseUser.projectIds || data.projectIds || [],
                    preferredTheme: responseUser.preferredTheme || data.preferredTheme || null,
                    localStorageRef: responseUser.localStorageRef || data.localStorageRef || null
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



    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
