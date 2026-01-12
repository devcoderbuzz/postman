import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { updateUser } from '../services/apiservice';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState('light');
    const lastSyncedTheme = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            lastSyncedTheme.current = savedTheme;
        } else {
            lastSyncedTheme.current = 'light';
        }
    }, []);

    // Apply preferredTheme from user profile on login
    useEffect(() => {
        if (user && user.preferredTheme && user.preferredTheme !== theme) {
            console.log(`Applying preferredTheme from user profile: ${user.preferredTheme}`);
            setTheme(user.preferredTheme);
            lastSyncedTheme.current = user.preferredTheme;
        }
    }, [user?.preferredTheme]);

    // Reset to light theme on logout
    useEffect(() => {
        if (!user) {
            setTheme('light');
            lastSyncedTheme.current = 'light';
        }
    }, [user]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);

        // Call API only if theme changes and user is logged in
        // and ensure we don't re-sync if the theme matches what we just applied from the user profile
        if (user && user.token && lastSyncedTheme.current !== theme) {
            console.log(`Syncing preferredTheme: ${theme} for user ${user.id || user.userId}`);
            updateUser({
                id: user.id || user.userId,
                preferredTheme: theme
            }, user.token)
                .then(() => {
                    lastSyncedTheme.current = theme;
                })
                .catch(err => {
                    console.error('Failed to sync theme to server:', err);
                });
        }
    }, [theme, user?.token]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
