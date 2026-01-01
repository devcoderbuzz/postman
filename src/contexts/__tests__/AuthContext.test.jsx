import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { login as loginService } from '../../services/apiservice';

// Mock the API service
vi.mock('../../services/apiservice', () => ({
    login: vi.fn()
}));

// Test component to consume the context
const TestComponent = () => {
    const { user, login, logout } = useAuth();
    return (
        <div>
            <div data-testid="user-value">{user ? user.username : 'null'}</div>
            <button onClick={() => login('test', 'pass')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    it('should initialize with null user (and clear storage on mount)', () => {
        sessionStorage.setItem('user', JSON.stringify({ username: 'existing' }));
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.getByTestId('user-value')).toHaveTextContent('null');
        expect(sessionStorage.getItem('user')).toBeNull();
    });

    it('should login successfully', async () => {
        const mockUserData = { username: 'testuser', role: 'user', token: 'abcd' };
        loginService.mockResolvedValue(mockUserData);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByText('Login').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('user-value')).toHaveTextContent('testuser');
        });

        expect(loginService).toHaveBeenCalledWith('test', 'pass');
        expect(sessionStorage.getItem('authToken')).toBe('abcd');
    });

    it('should handle logout', async () => {
        const mockUserData = { username: 'testuser', role: 'user', token: 'abcd' };
        loginService.mockResolvedValue(mockUserData);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            screen.getByText('Login').click();
        });

        await waitFor(() => expect(screen.getByTestId('user-value')).toHaveTextContent('testuser'));

        await act(async () => {
            screen.getByText('Logout').click();
        });

        expect(screen.getByTestId('user-value')).toHaveTextContent('null');
        expect(sessionStorage.getItem('authToken')).toBeNull();
    });

    it('should handle global auth-logout event', async () => {
        const mockUserData = { username: 'testuser', role: 'user', token: 'abcd' };
        loginService.mockResolvedValue(mockUserData);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Log in first
        await act(async () => {
            screen.getByText('Login').click();
        });
        await waitFor(() => expect(screen.getByTestId('user-value')).toHaveTextContent('testuser'));

        // Dispatch event
        await act(async () => {
            window.dispatchEvent(new Event('auth-logout'));
        });

        expect(screen.getByTestId('user-value')).toHaveTextContent('null');
    });
});
