
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { UserWorkspace } from '../UserWorkspace';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as apiService from '../../services/apiservice';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('../../contexts/AuthContext');
vi.mock('../../contexts/ThemeContext');
vi.mock('../../services/apiservice');
vi.mock('axios');
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

vi.mock('../../components/Layout', () => ({ Layout: ({ children }) => <div data-testid="layout">{children}</div> }));
vi.mock('../../components/Header', () => ({
    Header: ({ setActiveView }) => (
        <div data-testid="header">
            <button onClick={() => setActiveView('settings')}>View Settings</button>
            <button onClick={() => setActiveView('environments')}>View Environments</button>
        </div>
    )
}));
vi.mock('../../components/Footer', () => ({ Footer: () => <div>Footer</div> }));

vi.mock('../../components/CollectionsPanel', () => ({
    CollectionsPanel: ({ onLoadRequest }) => (
        <div data-testid="collections-panel">
            <button onClick={() => onLoadRequest({ requestId: 'r1', name: 'Req 1', url: 'http://test.com', method: 'GET' })}>
                Select Req 1
            </button>
        </div>
    )
}));

vi.mock('../../components/HistoryPanel', () => ({ HistoryPanel: () => <div>History Panel</div> }));
vi.mock('../../components/EnvironmentManager', () => ({ EnvironmentManager: () => <div data-testid="env-manager">Environment Manager</div> }));
vi.mock('../../components/Settings', () => ({ Settings: () => <div data-testid="settings-panel">Settings Panel</div> }));
vi.mock('../../components/EditDataPanel', () => ({ EditDataPanel: () => null }));
vi.mock('../../components/KeyValueEditor', () => ({ KeyValueEditor: () => <div>KV Editor</div> }));

vi.mock('../../components/RequestBar', () => ({
    RequestBar: ({ url, setUrl, method, setMethod, onSend }) => (
        <div data-testid="request-bar">
            <input data-testid="url-input" value={url} onChange={e => setUrl(e.target.value)} />
            <select data-testid="method-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
            </select>
            <button onClick={onSend}>Send</button>
        </div>
    )
}));

vi.mock('../../components/RequestTabs', () => ({
    RequestTabs: ({ onAdd, onClose, requests, activeRequestId, onActivate }) => (
        <div data-testid="request-tabs-bar">
            <button onClick={onAdd}>New Tab</button>
            {requests && requests.map(t => (
                <div key={t.id} data-testid={`tab-${t.id}`}>
                    <span onClick={() => onActivate(t.id)}>{t.name || 'New Request'}</span>
                    <button onClick={(e) => { e.stopPropagation(); onClose(t.id); }}>Close</button>
                </div>
            ))}
        </div>
    )
}));

vi.mock('../../components/Tabs', () => ({
    Tabs: ({ tabs, activeTab, onTabChange }) => (
        <div data-testid="main-tabs">
            {tabs.map(t => (
                <button key={t.id} onClick={() => onTabChange(t.id)}>{t.label}</button>
            ))}
        </div>
    )
}));

vi.mock('../../components/AuthEditor', () => ({
    AuthEditor: ({ authType, setAuthType, authData, setAuthData }) => (
        <div data-testid="auth-editor">
            <select data-testid="auth-type-select" value={authType} onChange={e => setAuthType(e.target.value)}>
                <option value="none">None</option>
                <option value="bearer">Bearer</option>
                <option value="basic">Basic</option>
            </select>
            {authType === 'bearer' && (
                <input
                    data-testid="bearer-token-input"
                    value={authData.token || ''}
                    onChange={e => setAuthData({ ...authData, token: e.target.value })}
                />
            )}
            {authType === 'basic' && (
                <>
                    <input data-testid="basic-user" value={authData.username || ''} onChange={e => setAuthData({ ...authData, username: e.target.value })} />
                    <input data-testid="basic-pass" value={authData.password || ''} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
                </>
            )}
        </div>
    )
}));

describe('UserWorkspace Extended', () => {
    const mockUser = { username: 'testuser', role: 'user', token: 'valid-token', projectIds: [] };

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser, logout: vi.fn() });
        useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() });
        apiService.getEnvDetails.mockResolvedValue({
            'Dev': { 'API_URL': 'http://dev.api' }
        });
        apiService.getAllAppCodesForAdmin.mockResolvedValue([]);

        axios.mockResolvedValue({
            data: { isError: false, data: {} },
            status: 200,
            headers: {}
        });
    });

    it('switches views correctly', async () => {
        render(<UserWorkspace />);
        fireEvent.click(screen.getByText('View Settings'));
        expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
        fireEvent.click(screen.getByText('View Environments'));
        expect(screen.getByTestId('env-manager')).toBeInTheDocument();
    });

    it('sends request with Bearer token', async () => {
        render(<UserWorkspace />);
        fireEvent.click(screen.getByText('Auth'));
        const authSelect = screen.getByTestId('auth-type-select');
        fireEvent.change(authSelect, { target: { value: 'bearer' } });
        const tokenInput = screen.getByTestId('bearer-token-input');
        fireEvent.change(tokenInput, { target: { value: 'my-token' } });
        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });
        await waitFor(() => {
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer my-token'
                    })
                })
            }));
        });
    });

    it('sends request with Basic Auth', async () => {
        render(<UserWorkspace />);
        fireEvent.click(screen.getByText('Auth'));
        const authSelect = screen.getByTestId('auth-type-select');
        fireEvent.change(authSelect, { target: { value: 'basic' } });
        fireEvent.change(screen.getByTestId('basic-user'), { target: { value: 'user' } });
        fireEvent.change(screen.getByTestId('basic-pass'), { target: { value: 'pass' } });
        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });
        const expectedAuth = 'Basic ' + btoa('user:pass');
        await waitFor(() => {
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': expectedAuth
                    })
                })
            }));
        });
    });

    it('replaces environment variables in URL', async () => {
        render(<UserWorkspace />);
        await waitFor(() => expect(apiService.getEnvDetails).toHaveBeenCalled());
        const combs = screen.getAllByRole('combobox');
        const devOption = await screen.findByText("Dev");
        const envSelect = devOption.closest('select');
        fireEvent.change(envSelect, { target: { value: 'Dev' } });
        const urlInput = screen.getByTestId('url-input');
        fireEvent.change(urlInput, { target: { value: '{{API_URL}}/users' } });
        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });
        await waitFor(() => {
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    url: 'http://dev.api/users'
                })
            }));
        });
    });

    it('loads request from collections panel and updates tabs', async () => {
        render(<UserWorkspace />);

        fireEvent.click(screen.getByText('Select Req 1'));

        // Should update URL and Method
        await waitFor(() => {
            expect(screen.getByTestId('url-input')).toHaveValue('http://test.com');
            expect(screen.getByTestId('method-select')).toHaveValue('GET');
        });
    });

    it('handles request tabs interactions', async () => {
        render(<UserWorkspace />);

        // Add new tab
        fireEvent.click(screen.getByText('New Tab'));

        // We should have at least 2 tabs now (1 default + 1 new)
        await waitFor(() => expect(screen.getAllByTestId(/tab-/).length).toBeGreaterThan(1));

        // Close the first tab
        // Get the close button of the first tab
        const firstTab = screen.getAllByTestId(/tab-/)[0];
        fireEvent.click(within(firstTab).getByText('Close'));

        // Check reduction (NOTE: logic depends on implementation, might need to wait)
        // UserWorkspace maintains tabs state.
    });

    it('handles request failure', async () => {
        axios.mockRejectedValue(new Error('Network Error'));
        render(<UserWorkspace />);

        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        // Should handle error gracefully (maybe log to console or show error)
        // We assume axios was called.
        await waitFor(() => expect(axios).toHaveBeenCalled());
    });
});
