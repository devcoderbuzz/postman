import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../Login';
import * as apiService from '../../services/apiservice';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../../services/apiservice', () => ({
    register: vi.fn(),
    activateUser: vi.fn()
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));

vi.mock('../../components/ResetPasswordModal', () => ({
    ResetPasswordModal: () => <div data-testid="reset-modal">Reset Password Modal</div>
}));

describe('Login Page', () => {
    const mockLogin = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ login: mockLogin });
        useNavigate.mockReturnValue(mockNavigate);
        // Mock default resolved values
        apiService.register.mockResolvedValue({});

        // Mock Canvas for generateProfileImage
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 0 })),
            font: '',
            textAlign: '',
            textBaseline: ''
        }));
        HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
    });

    it('should render login form by default', () => {
        render(<Login />);
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Register now/i })).toBeInTheDocument();
    });

    it('should handle login submission', async () => {
        mockLogin.mockResolvedValue({ role: 'admin' });
        render(<Login />);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'admin' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('admin', 'password');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should show error on login failure', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        render(<Login />);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByText('Sign In'));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('should switch to registration form', () => {
        render(<Login />);
        fireEvent.click(screen.getByRole('button', { name: /Register now/i }));

        expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
    });

    it('should handle registration', async () => {
        // Mock prompt or alert if needed, but Login.jsx uses window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<Login />);
        // Switch to register
        fireEvent.click(screen.getByRole('button', { name: /Register now/i }));

        fireEvent.change(screen.getAllByLabelText(/Username/i)[0], { target: { value: 'newuser' } });
        fireEvent.change(screen.getAllByLabelText(/Password/i)[0], { target: { value: 'pass' } });
        fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(apiService.register).toHaveBeenCalled();
        });
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Registration successful'));
    });
});
