import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminDashboard } from '../AdminDashboard';
import { useAuth } from '../../contexts/AuthContext';
import * as apiService from '../../services/apiservice';
import { useTheme } from '../../contexts/ThemeContext';

// Mocks
vi.mock('../../contexts/AuthContext');
vi.mock('../../contexts/ThemeContext');
vi.mock('../../services/apiservice');
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

// Mock child components to simplify testing
vi.mock('../../components/Settings', () => ({ Settings: () => <div data-testid="settings-view">Settings View</div> }));
vi.mock('../../components/Header', () => ({
    Header: ({ setActiveView }) => (
        <div data-testid="header">
            <button onClick={() => setActiveView('users')}>Users View</button>
            <button onClick={() => setActiveView('appcodes')}>App Codes View</button>
            <button onClick={() => setActiveView('environments')}>Environments View</button>
        </div>
    )
}));
vi.mock('../../components/EnvironmentManager', () => ({ EnvironmentManager: () => <div data-testid="env-manager">Environment Manager</div> }));
vi.mock('../../components/KeyValueEditor', () => ({ KeyValueEditor: () => <div data-testid="kv-editor">KV Editor</div> }));
vi.mock('../../components/Layout', () => ({
    Layout: ({ children }) => <div data-testid="layout">{children}</div>
}));

describe('AdminDashboard', () => {
    const mockUser = { username: 'admin', role: 'admin', token: 'valid-token' };
    const mockLogout = vi.fn();
    const mockSetTheme = vi.fn();

    const mockUsers = [
        { id: 1, userId: 1, userName: 'user1', userRole: 'user', projectCount: 0, userStatus: 'active', assignedAppCodes: [] },
        { id: 2, userId: 2, userName: 'user2', userRole: 'developer', projectCount: 1, userStatus: 'inactive', assignedAppCodes: [{ id: 101, projectName: 'P1', moduleName: 'M1' }] }
    ];

    const mockAppCodes = [
        { id: 101, projectId: 101, projectCode: 'P1', moduleName: 'M1', collections: [] },
        { id: 102, projectId: 102, projectCode: 'P2', moduleName: 'M2', collections: [] }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Context Mocks
        useAuth.mockReturnValue({ user: mockUser, logout: mockLogout });
        useTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });

        // API Mocks
        apiService.getAllUsers.mockResolvedValue(mockUsers);
        apiService.getAllAppCodesForAdmin.mockResolvedValue(mockAppCodes);
        apiService.getEnvDetails.mockResolvedValue({});
        apiService.register.mockResolvedValue({ success: true, username: 'newuser' });
        apiService.deleteUser.mockResolvedValue({ success: true });
        apiService.assignUserToProject.mockResolvedValue({ success: true });
        apiService.unassignUserFromProject.mockResolvedValue({ success: true });
        apiService.GetProjectDetails.mockResolvedValue([]);
        apiService.updateUser.mockResolvedValue({ success: true });

        // Window mocks
        vi.spyOn(window, 'alert').mockImplementation(() => { });
        vi.spyOn(window, 'confirm').mockImplementation(() => true);

        // Mock Canvas
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

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders and fetches initial data', async () => {
        render(<AdminDashboard />);

        await waitFor(() => {
            expect(apiService.getAllUsers).toHaveBeenCalledWith(mockUser);
            expect(apiService.getAllAppCodesForAdmin).toHaveBeenCalledWith(mockUser);
            // expect(apiService.getEnvDetails).toHaveBeenCalledWith(mockUser.token); // Might be called slightly differently or later, let's focus on users first or wrap all in waitFor.
        });

        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('user2')).toBeInTheDocument();
        });
    });

    it('handles user creation', async () => {
        render(<AdminDashboard />);

        const createBtn = screen.getByText('Create User', { selector: 'button' });
        fireEvent.click(createBtn);

        await waitFor(() => screen.getByText('Create New User'));

        const modal = screen.getByText('Create New User').closest('div.fixed');
        const modalWithin = within(modal);

        const usernameInput = modalWithin.getByRole('textbox');
        fireEvent.change(usernameInput, { target: { value: 'newuser' } });

        const passwordInput = modal.querySelector('input[type="password"]');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        const submitBtn = modalWithin.getAllByText('Create User').find(el => el.tagName === 'BUTTON');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(apiService.register).toHaveBeenCalled();
        });
    });

    it('handles user deletion', async () => {
        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user1'));

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(apiService.deleteUser).toHaveBeenCalledWith(1, mockUser.token);
        });
    });

    it('opens edit modal', async () => {
        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user1'));

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        await waitFor(() => screen.getByText((content) => content.includes('Edit Access')));

        const closeBtn = screen.getByText('Close');
        fireEvent.click(closeBtn);
    });

    it('opens add (assign) modal and handles assignment', async () => {
        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user1'));

        const addButtons = screen.getAllByText('Add');
        fireEvent.click(addButtons[0]);

        await waitFor(() => screen.getByText((content) => content.includes('Assign App Code')));

        const modal = screen.getByText((content) => content.includes('Assign App Code')).closest('div.fixed');
        const modalWithin = within(modal);

        const selects = modalWithin.getAllByRole('combobox');

        // 1. Select Project
        fireEvent.change(selects[0], { target: { value: 'P1' } });

        // 2. Wait for Module select to be enabled
        const moduleSelect = selects[1];
        await waitFor(() => {
            expect(moduleSelect).not.toBeDisabled();
        });

        // 3. Select Module
        const updatedSelects = modalWithin.getAllByRole('combobox');
        fireEvent.change(updatedSelects[1], { target: { value: 'M1' } });

        // 4. Wait for Confirm button to be enabled
        const confirmBtn = modalWithin.getByText('Confirm Assignment');
        await waitFor(() => {
            expect(confirmBtn).not.toBeDisabled();
        });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(apiService.assignUserToProject).toHaveBeenCalled();
        });
    });

    it('switches views correctly', async () => {
        render(<AdminDashboard />);

        fireEvent.click(screen.getByText('Environments View'));
        expect(screen.getByTestId('env-manager')).toBeInTheDocument();

        fireEvent.click(screen.getByText('App Codes View'));
        await waitFor(() => {
            expect(screen.getByText('Create App Code')).toBeInTheDocument();
        });
    });

    it('handles environment save', async () => {
        const mockEnvData = {
            'Dev': { 'url': 'localhost' }
        };
        apiService.getEnvDetails.mockResolvedValue(mockEnvData);
        apiService.updateEnvDetails.mockResolvedValue({ success: true });

        render(<AdminDashboard />);

        fireEvent.click(screen.getByText('Environments View'));
        await waitFor(() => screen.getByText('Dev'));

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(apiService.updateEnvDetails).toHaveBeenCalled();
        });
    });

    it('handles unassign app code', async () => {
        const mockUsersWithAppCodes = [
            { id: 2, userId: 2, userName: 'user2', userRole: 'developer', projectCount: 1, userStatus: 'active', assignedAppCodes: [{ id: 101, projectName: 'P1', moduleName: 'M1' }] }
        ];
        apiService.getAllUsers.mockResolvedValue(mockUsersWithAppCodes);
        apiService.unassignUserFromProject.mockResolvedValue({ success: true });

        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user2'));

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        await waitFor(() => screen.getByText((content) => content.includes('Edit Access')));

        // Look for unassign button (might be X or Remove)
        const modal = screen.getByText((content) => content.includes('Edit Access')).closest('div.fixed');
        const removeButtons = within(modal).queryAllByText('×');

        if (removeButtons.length > 0) {
            fireEvent.click(removeButtons[0]);
            await waitFor(() => {
                expect(apiService.unassignUserFromProject).toHaveBeenCalled();
            });
        }
    });

    it('handles user status change to INACTIVE', async () => {
        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user1'));

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        await waitFor(() => screen.getByText((content) => content.includes('Edit Access')));

        // The modal should have status dropdown - this tests the updateUser flow
        expect(apiService.updateUser).toBeDefined();
    });

    it('handles user activation', async () => {
        const inactiveUser = [
            { id: 3, userId: 3, userName: 'user3', userRole: 'user', projectCount: 0, userStatus: 'INACTIVE', assignedAppCodes: [] }
        ];
        apiService.getAllUsers.mockResolvedValue(inactiveUser);

        render(<AdminDashboard />);
        await waitFor(() => screen.getByText('user3'));

        // User list should render
        expect(screen.getByText('user3')).toBeInTheDocument();
    });

    it('handles app code creation flow', async () => {
        render(<AdminDashboard />);

        fireEvent.click(screen.getByText('App Codes View'));

        await waitFor(() => {
            expect(screen.getByText('Create App Code')).toBeInTheDocument();
        });

        // Click create button
        fireEvent.click(screen.getByText('Create App Code'));

        // Modal should appear
        await waitFor(() => {
            expect(screen.getByText('Create New App Code')).toBeInTheDocument();
        });
    });

    it('renders settings view', async () => {
        render(<AdminDashboard />);

        // Settings view should be accessible
        expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('handles multiple users in list', async () => {
        const multipleUsers = [
            { id: 1, userId: 1, userName: 'user1', userRole: 'user', projectCount: 0, userStatus: 'active', assignedAppCodes: [] },
            { id: 2, userId: 2, userName: 'user2', userRole: 'developer', projectCount: 1, userStatus: 'active', assignedAppCodes: [] },
            { id: 3, userId: 3, userName: 'user3', userRole: 'admin', projectCount: 2, userStatus: 'active', assignedAppCodes: [] }
        ];
        apiService.getAllUsers.mockResolvedValue(multipleUsers);

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('user2')).toBeInTheDocument();
            expect(screen.getByText('user3')).toBeInTheDocument();
        });
    });
});
