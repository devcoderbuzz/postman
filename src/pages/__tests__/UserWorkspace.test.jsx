import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserWorkspace } from '../UserWorkspace';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as apiService from '../../services/apiservice';
import axios from 'axios';

// Mocks
vi.mock('../../contexts/AuthContext');
vi.mock('../../contexts/ThemeContext');
vi.mock('../../services/apiservice');
vi.mock('axios');
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

// Components Mocks
vi.mock('../../components/Layout', () => ({ Layout: ({ children }) => <div data-testid="layout">{children}</div> }));
vi.mock('../../components/Header', () => ({
    Header: ({ setActiveView }) => (
        <div data-testid="header">
            <button onClick={() => setActiveView('collections')}>Collections</button>
            <button onClick={() => setActiveView('history')}>History</button>
            <button onClick={() => setActiveView('environments')}>Environments</button>
            <button onClick={() => setActiveView('settings')}>Settings</button>
        </div>
    )
}));
vi.mock('../../components/Footer', () => ({ Footer: () => <div data-testid="footer">Footer</div> }));

vi.mock('../../components/RequestBar', () => ({
    RequestBar: ({ url, setUrl, method, setMethod, onSend }) => (
        <div data-testid="request-bar">
            <input data-testid="url-input" value={url} onChange={e => setUrl(e.target.value)} />
            <select data-testid="method-select" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
            </select>
            <button onClick={onSend}>Send</button>
        </div>
    )
}));

vi.mock('../../components/RequestTabs', () => ({
    RequestTabs: ({ activeTab, onTabChange = () => { }, headers = [], setHeaders = () => { }, params = [], setParams = () => { }, body, setBody, bodyType, setBodyType }) => (
        <div data-testid="request-tabs">
            <button onClick={() => onTabChange('params')}>Params</button>
            <button onClick={() => onTabChange('headers')}>Headers</button>
            <button onClick={() => onTabChange('body')}>Body</button>
            <button onClick={() => onTabChange('auth')}>Auth</button>
            {activeTab === 'headers' && setHeaders && (
                <button onClick={() => setHeaders([...headers, { key: 'X-Test', value: 'test', active: true }])}>
                    Add Header
                </button>
            )}
            {activeTab === 'params' && setParams && (
                <button onClick={() => setParams([...params, { key: 'test', value: 'value', active: true }])}>
                    Add Param
                </button>
            )}
        </div>
    )
}));

vi.mock('../../components/Tabs', () => ({ Tabs: () => <div data-testid="tabs">Tabs</div> }));
vi.mock('../../components/KeyValueEditor', () => ({ KeyValueEditor: () => <div data-testid="kv-editor">KV Editor</div> }));
vi.mock('../../components/BodyEditor', () => ({ BodyEditor: () => <div data-testid="body-editor">Body Editor</div> }));
vi.mock('../../components/AuthEditor', () => ({ AuthEditor: () => <div data-testid="auth-editor">Auth Editor</div> }));
vi.mock('../../components/ResponseViewer', () => ({
    ResponseViewer: ({ response }) => (
        <div data-testid="response-viewer">
            {response && <div data-testid="response-status">{response.status}</div>}
        </div>
    )
}));
vi.mock('../../components/CollectionsPanel', () => ({ CollectionsPanel: () => <div data-testid="collections-panel">Collections</div> }));
vi.mock('../../components/HistoryPanel', () => ({ HistoryPanel: () => <div data-testid="history-panel">History</div> }));
vi.mock('../../components/EnvironmentManager', () => ({ EnvironmentManager: () => <div data-testid="env-manager">Env Manager</div> }));
vi.mock('../../components/Settings', () => ({ Settings: () => <div data-testid="settings">Settings</div> }));
vi.mock('../../components/SaveRequestModal', () => ({ SaveRequestModal: () => null }));
vi.mock('../../components/ImportModal', () => ({ ImportModal: () => null }));
vi.mock('../../components/EditDataPanel', () => ({ EditDataPanel: () => null }));

describe('UserWorkspace', () => {
    const mockUser = { username: 'testuser', role: 'user', token: 'valid-token', projectIds: [] };
    const mockLogout = vi.fn();
    const mockSetTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser, logout: mockLogout });
        useTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });

        apiService.getCollectionsByProjectId.mockResolvedValue([]);
        apiService.getAllProjects.mockResolvedValue([]);
        apiService.getAllAppCodesForAdmin.mockResolvedValue([]);
        apiService.getEnvDetails.mockResolvedValue({});

        // Axios for request sending
        axios.mockResolvedValue({
            data: {
                isError: false,
                status: 200,
                statusText: 'OK',
                headers: { 'content-type': 'application/json' },
                data: { message: 'success' }
            }
        });

        // Mock interceptors
        axios.interceptors = {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() }
        };

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true
        });
    });

    it('renders workspace components', async () => {
        render(<UserWorkspace />);
        await waitFor(() => {
            expect(screen.getByTestId('layout')).toBeInTheDocument();
            expect(screen.getByTestId('request-bar')).toBeInTheDocument();
        });
    });

    it('handles sending a GET request', async () => {
        render(<UserWorkspace />);

        const urlInput = screen.getByTestId('url-input');
        fireEvent.change(urlInput, { target: { value: 'http://api.test/users' } });

        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        await waitFor(() => {
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                method: 'POST',
                url: 'http://localhost:3001/proxy'
            }));
        });
    });

    it('handles sending a POST request with body', async () => {
        render(<UserWorkspace />);

        const urlInput = screen.getByTestId('url-input');
        fireEvent.change(urlInput, { target: { value: 'http://api.test/users' } });

        const methodSelect = screen.getByTestId('method-select');
        fireEvent.change(methodSelect, { target: { value: 'POST' } });

        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        await waitFor(() => {
            expect(axios).toHaveBeenCalled();
        });
    });

    it('handles environment loading', async () => {
        render(<UserWorkspace />);
        await waitFor(() => {
            expect(apiService.getEnvDetails).toHaveBeenCalled();
        });
    });

    it('displays response after successful request', async () => {
        render(<UserWorkspace />);

        const sendBtn = screen.getByText('Send');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        await waitFor(() => {
            expect(screen.getByTestId('response-status')).toHaveTextContent('200');
        });
    });

    it('handles different HTTP methods', async () => {
        render(<UserWorkspace />);

        const methodSelect = screen.getByTestId('method-select');

        // Test PUT
        fireEvent.change(methodSelect, { target: { value: 'PUT' } });
        expect(methodSelect.value).toBe('PUT');

        // Test DELETE
        fireEvent.change(methodSelect, { target: { value: 'DELETE' } });
        expect(methodSelect.value).toBe('DELETE');
    });

    it('persists layout preference to localStorage', async () => {
        render(<UserWorkspace />);

        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalled();
        });
    });
});
