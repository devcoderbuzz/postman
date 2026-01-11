
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
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

// Mock child components
vi.mock('../../components/Settings', () => ({ Settings: () => <div data-testid="settings-view">Settings View</div> }));
vi.mock('../../components/Header', () => ({
    Header: ({ setActiveView }) => (
        <div data-testid="header">
            <button onClick={() => setActiveView('users')}>Users View</button>
            <button onClick={() => setActiveView('manageAppCodes')}>App Codes View</button>
            <button onClick={() => setActiveView('appcodes')}>Collection Details View</button>
            <button onClick={() => setActiveView('environments')}>Environments View</button>
        </div>
    )
}));
vi.mock('../../components/EnvironmentManager', () => ({
    EnvironmentManager: ({ activeEnv, setActiveEnv, environments = [] }) => (
        <div data-testid="env-manager">
            {environments.map(env => (
                <button key={env.id} onClick={() => setActiveEnv(env.id)}>{env.name}</button>
            ))}
        </div>
    )
}));
vi.mock('../../components/KeyValueEditor', () => ({ KeyValueEditor: () => <div data-testid="kv-editor">KV Editor</div> }));
vi.mock('../../components/Layout', () => ({
    Layout: ({ children }) => <div data-testid="layout">{children}</div>
}));

describe('AdminDashboard Extended', () => {
    const mockUser = { username: 'admin', role: 'admin', token: 'valid-token' };
    const mockLogout = vi.fn();
    const mockSetTheme = vi.fn();

    const mockUsers = [
        { id: 1, userId: 1, userName: 'user1', userRole: 'user', projectCount: 0, userStatus: 'active', assignedAppCodes: [] }
    ];

    const mockAppCodes = [
        {
            id: 101,
            projectId: 101,
            projectName: 'P1',
            moduleName: 'M1',
            appCode: 'P1',
            collections: [
                {
                    collectionId: 'c1',
                    name: 'Collection 1',
                    requests: [
                        { requestId: 'r1', name: 'Req 1', method: 'GET', url: 'http://test.com', headers: '{"Content-Type":"application/json"}', body: '{"foo":"bar"}' },
                        { requestId: 'r2', name: 'Req 2', method: 'POST', url: 'http://test.com', headers: { "Authorization": "Bearer token" }, body: { foo: "bar" } },
                        { requestId: 'r3', name: 'Req 3', method: 'DELETE', url: 'http://test.com' }
                    ]
                }
            ]
        }
    ];

    const mockEnvironments = {
        'Dev': { 'url': 'localhost' },
        'Prod': { 'url': 'api.prod.com' }
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useAuth.mockReturnValue({ user: mockUser, logout: mockLogout });
        useTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });

        apiService.getAllUsers.mockResolvedValue(mockUsers);
        apiService.getAllAppCodes.mockResolvedValue(mockAppCodes);
        apiService.getCollectionDetails.mockResolvedValue(mockAppCodes);
        apiService.getEnvDetails.mockResolvedValue(mockEnvironments);
        apiService.updateEnvDetails.mockResolvedValue({ success: true });
        apiService.unassignUserFromProject.mockResolvedValue({ success: true });

        vi.spyOn(window, 'alert').mockImplementation(() => { });
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('handles app code creation flow', async () => {
        render(<AdminDashboard />);

        fireEvent.click(screen.getByText('Users View'));

        await waitFor(() => screen.getByText('App Codes'));
        const createButtons = screen.getAllByText('CREATE');
        fireEvent.click(createButtons[0]); // First CREATE is for App Codes

        const modal = screen.getByText('Create New Module').closest('div.fixed');
        const modalWithin = within(modal);

        fireEvent.change(modalWithin.getByPlaceholderText('e.g. GAPI-CB-SG'), { target: { value: 'NewP' } });
        fireEvent.change(modalWithin.getByPlaceholderText('CASA, FD, LOAN etc'), { target: { value: 'NewM' } });

        fireEvent.click(modalWithin.getByText('Create App Code', { selector: 'button[type="submit"]' }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('created'));
        });
    });

    it('expands collections and views request details', async () => {
        render(<AdminDashboard />);
        fireEvent.click(screen.getByText('Collection Details View'));

        await waitFor(() => expect(apiService.getAllAppCodes).toHaveBeenCalled());
        await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(1));

        const projectSelect = screen.getByDisplayValue('-- Select Project --');
        fireEvent.change(projectSelect, { target: { value: 'P1' } });

        await waitFor(() => expect(screen.getByDisplayValue('-- Select Module --')).not.toBeDisabled());
        const moduleSelect = screen.getByDisplayValue('-- Select Module --');
        fireEvent.change(moduleSelect, { target: { value: 'M1' } });

        await waitFor(() => screen.getByText('Collection 1'));

        const collectionRow = screen.getByText('Collection 1').closest('tr');
        const expandBtn = within(collectionRow).getAllByRole('button')[0];
        fireEvent.click(expandBtn);

        await waitFor(() => screen.getByText('Req 1'));

        fireEvent.click(screen.getByText('Req 1'));

        await waitFor(() => {
            const headers = screen.getAllByRole('heading', { level: 3 });
            expect(headers.map(h => h.textContent)).toContain('Req 1');
        });

        // Assert URL presence (handling multiple occurrences due to list view + modal)
        expect(screen.getAllByText('http://test.com').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByText('×'));
        await waitFor(() => expect(screen.queryByRole('heading', { level: 3, name: 'Req 1' })).not.toBeInTheDocument());
    });

    it('handles request details with Object headers and Body object', async () => {
        render(<AdminDashboard />);
        fireEvent.click(screen.getByText('Collection Details View'));

        await waitFor(() => expect(apiService.getAllAppCodes).toHaveBeenCalled());
        await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(1));

        fireEvent.change(screen.getByDisplayValue('-- Select Project --'), { target: { value: 'P1' } });

        await waitFor(() => {
            const moduleSelect = screen.getByDisplayValue('-- Select Module --');
            expect(moduleSelect).not.toBeDisabled();
        });

        const moduleSelect = screen.getByDisplayValue('-- Select Module --');
        fireEvent.change(moduleSelect, { target: { value: 'M1' } });

        await waitFor(() => screen.getByText('Collection 1'));
        const collectionRow = screen.getByText('Collection 1').closest('tr');
        const expandBtn = within(collectionRow).getAllByRole('button')[0];
        fireEvent.click(expandBtn);

        // Wait for ANY request to appear first
        await waitFor(() => screen.getByText('Req 1'));

        // Then look for Req 2
        await waitFor(() => expect(screen.getByText('Req 2')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Req 2'));

        await waitFor(() => screen.getByText('Authorization'));
        expect(screen.getByText('Bearer token')).toBeInTheDocument();
    });

    it('handles environment save correctly', async () => {
        // Explicitly mock for this test to ensure data flow
        apiService.getEnvDetails.mockResolvedValue({
            'Dev': { 'url': 'localhost' }
        });

        render(<AdminDashboard />);
        fireEvent.click(screen.getByText('Environments View'));

        await waitFor(() => expect(apiService.getEnvDetails).toHaveBeenCalled());

        await waitFor(() => expect(screen.getAllByText('Dev').length).toBeGreaterThan(0));

        const devElements = screen.getAllByText('Dev');
        const devButton = devElements.find(el => el.tagName === 'BUTTON') || devElements[0];
        fireEvent.click(devButton);

        const saveBtn = screen.getByText('Save');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(apiService.updateEnvDetails).toHaveBeenCalled();
        });
    });

    it('handles environment save failure', async () => {
        apiService.getEnvDetails.mockResolvedValue({
            'Dev': { 'url': 'localhost' }
        });
        apiService.updateEnvDetails.mockRejectedValue(new Error('Failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(<AdminDashboard />);
        fireEvent.click(screen.getByText('Environments View'));

        await waitFor(() => expect(apiService.getEnvDetails).toHaveBeenCalled());
        await waitFor(() => expect(screen.getAllByText('Dev').length).toBeGreaterThan(0));

        const devElements = screen.getAllByText('Dev');
        const devButton = devElements.find(el => el.tagName === 'BUTTON') || devElements[0];
        fireEvent.click(devButton);

        const saveBtn = screen.getByText('Save');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(apiService.updateEnvDetails).toHaveBeenCalled();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to update environment details:', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
