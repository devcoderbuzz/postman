
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { EditDataPanel } from '../EditDataModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as apiService from '../../services/apiservice';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    ChevronRight: () => <svg data-testid="icon-chevron-right" />,
    ChevronDown: () => <svg data-testid="icon-chevron-down" />,
    Plus: () => <svg data-testid="icon-plus" />,
    Trash2: () => <svg data-testid="icon-trash" />,
    X: () => <svg data-testid="icon-x" />,
    Edit2: () => <svg data-testid="icon-edit" />,
    MoreVertical: () => <svg data-testid="icon-more" />,
    GripVertical: () => <svg data-testid="icon-grip" />,
    Save: () => <svg data-testid="icon-save" />,
    Folder: () => <svg data-testid="icon-folder" />,
    FileText: () => <svg data-testid="icon-file-text" />,
    Search: () => <svg data-testid="icon-search" />,
    Sparkles: () => <svg data-testid="icon-sparkles" />,
    Play: () => <svg data-testid="icon-play" />,
    Lock: () => <svg data-testid="icon-lock" />,
    Globe: () => <svg data-testid="icon-globe" />
}));

vi.mock('../../services/apiservice', () => ({
    getAllAppCodesForAdmin: vi.fn(),
    createUpdateCollections: vi.fn(),
    createRequestData: vi.fn(),
    getAllProjects: vi.fn(),
    getAllAppCodes: vi.fn(),
    getCollectionDetails: vi.fn(),
    deleteCollection: vi.fn(),
    getEnvDetails: vi.fn(),
}));

const mockUser = {
    id: 'user1',
    assignedAppCodes: [
        { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] },
        { projectId: '102', projectName: 'Project B', moduleName: 'Module B', collections: [] }
    ],
    projectIds: ['101', '102']
};

vi.mock('../../contexts/AuthContext', async () => {
    return {
        useAuth: () => ({
            user: mockUser
        })
    };
});

// Mock child modals if needed (though existing tests worked without mocking them explicitly, 
// but mocking them avoids rendering noise or issues)
vi.mock('../ImportModal', () => ({
    ImportModal: ({ isOpen, onImport }) => isOpen ? (
        <div data-testid="import-modal">
            Import Header
            <input data-testid="curl-input" type="text" onChange={(e) => window.testCurl = e.target.value} />
            <button data-testid="trigger-curl-import" onClick={() => onImport('curl', window.testCurl || 'curl -X POST "https://api.example.com/data" -H "Content-Type: application/json" -d \'{"key": "value"}\'', null)}>Simulate Import</button>
        </div>
    ) : null
}));


describe('EditDataPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiService.getAllAppCodes.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] },
            { projectId: '102', projectName: 'Project B', moduleName: 'Module B', collections: [] }
        ]);
        apiService.getCollectionDetails.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] },
            { projectId: '102', projectName: 'Project B', moduleName: 'Module B', collections: [] }
        ]);
        apiService.createUpdateCollections.mockResolvedValue({ success: true, collectionId: 'c1' });
    });

    it('renders initial state correctly', async () => {
        await act(async () => {
            render(<EditDataPanel />);
        });

        expect(screen.getByText('My App Codes')).toBeInTheDocument();
        expect(screen.getByText('Select Project...')).toBeInTheDocument();
        expect(screen.getByText('Select an App Code to view collections')).toBeInTheDocument();
    });

    it('fetches and displays projects in dropdown', async () => {
        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => {
            expect(screen.getByText('Project A')).toBeInTheDocument();
        });

        const projectSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(projectSelect, { target: { value: 'Project A' } });

        expect(screen.getByDisplayValue('Project A')).toBeInTheDocument();
    });

    it('handles module selection and loads collections', async () => {
        const mockCollections = [
            { collectionId: 'c1', name: 'Collection 1', requests: [] }
        ];

        apiService.getAllAppCodes.mockResolvedValue([
            {
                projectId: '101',
                projectName: 'Project A',
                moduleName: 'Module A',
                collections: mockCollections
            }
        ]);

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));

        const projectSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(projectSelect, { target: { value: 'Project A' } });

        const moduleSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(moduleSelect, { target: { value: 'Module A' } });

        await waitFor(() => {
            expect(screen.getByText('Collection 1')).toBeInTheDocument();
        });
    });

    it('creates a new collection', async () => {
        apiService.getAllAppCodes.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] }
        ]);

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));

        const projectSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(projectSelect, { target: { value: 'Project A' } });
        const moduleSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(moduleSelect, { target: { value: 'Module A' } });

        const newCollectionBtn = await screen.findByText('New Collection');
        fireEvent.click(newCollectionBtn);

        expect(screen.getByText('New Collection', { selector: 'h3' })).toBeInTheDocument();

        const input = screen.getByPlaceholderText('Collection Name');
        fireEvent.change(input, { target: { value: 'New Test Collection' } });

        const createBtn = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(screen.getByText('New Test Collection')).toBeInTheDocument();
        });
    });

    it('expands collection and shows "No requests" if empty', async () => {
        const mockCollections = [
            { collectionId: 'c1', name: 'Collection 1', requests: [] }
        ];
        apiService.getAllAppCodes.mockResolvedValue([
            {
                projectId: '101',
                projectName: 'Project A',
                moduleName: 'Module A',
                collections: mockCollections
            }
        ]);

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Project A' } });
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Module A' } });

        await waitFor(() => screen.getByText('Collection 1'));

        const collectionRow = screen.getByText('Collection 1');
        fireEvent.click(collectionRow);

        expect(screen.getByText('No requests')).toBeInTheDocument();
    });

    it('opens import modal', async () => {
        apiService.getAllAppCodes.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] }
        ]);
        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Project A' } });
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Module A' } });

        const importBtn = await screen.findByText('Import');
        fireEvent.click(importBtn);

        // Expect mocked ImportModal content or header
        expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    });

    it('imports complex cURL command', async () => {
        apiService.getAllAppCodes.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] }
        ]);

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Project A' } });
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Module A' } });

        fireEvent.click(await screen.findByText('Import'));

        // Complex cURL: URL at end, escaped quotes in body
        const complexCurl = `curl -X POST -H "Content-Type: application/json" -d "{\\"key\\": \\"val\\\\\\"ue\\"}" "https://complex.example.com/api"`;

        // Update mock input
        const input = screen.getByTestId('curl-input');
        fireEvent.change(input, { target: { value: complexCurl } });

        const importBtn = screen.getByTestId('trigger-curl-import');
        fireEvent.click(importBtn);

        await waitFor(() => {
            expect(screen.getByDisplayValue('https://complex.example.com/api')).toBeInTheDocument();
            expect(screen.getByDisplayValue('POST')).toBeInTheDocument();
        });

        // Check body. It should be parsed and stringified.
        // Original: {"key": "val\"ue"}
        // Editor should show: { "key": "val\"ue" } (formatted)
        const bodyInput = screen.getAllByRole('textbox').find(e => e.value.includes('key'));
        expect(bodyInput.value).toContain('val\\"ue');
    });

    it('imports cURL command and populates request editor', async () => {
        apiService.getAllAppCodes.mockResolvedValue([
            { projectId: '101', projectName: 'Project A', moduleName: 'Module A', collections: [] }
        ]);

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Project A' } });
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Module A' } });

        // Open Import Modal
        fireEvent.click(await screen.findByText('Import'));

        // Trigger Import
        fireEvent.click(screen.getByTestId('trigger-curl-import'));

        // Expect Editor to open with populated data
        await waitFor(() => {
            expect(screen.getByDisplayValue('https://api.example.com/data')).toBeInTheDocument();
            expect(screen.getByDisplayValue('POST')).toBeInTheDocument();
        });

        // Check Body (needs to be resilient to formatting)
        const bodyInput = screen.getAllByRole('textbox').find(e => e.value.includes('key'));
        expect(bodyInput).not.toBeUndefined();
        expect(bodyInput.value).toContain('"key": "value"');
    });

    // --- Extended Tests ---

    it('opens request editor and saves a new request to collection', async () => {
        const mockCollections = [{
            collectionId: 'c1',
            name: 'Collection 1',
            requests: []
        }];

        const mockResponse = [
            {
                projectId: '101',
                projectName: 'Project A',
                moduleName: 'Module A',
                collections: mockCollections
            }
        ];

        apiService.getAllAppCodes.mockResolvedValue(mockResponse);
        apiService.createUpdateCollections.mockResolvedValue({ collectionId: 'c1', requests: [] });

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.change(comboboxes[0], { target: { value: 'Project A' } });
        await waitFor(() => expect(comboboxes[1]).not.toBeDisabled());
        fireEvent.change(comboboxes[1], { target: { value: 'Module A' } });

        await waitFor(() => screen.getByText('Collection 1'));

        const collectionRow = screen.getByText('Collection 1').closest('div');
        // Find menu button (has icon-more)
        const moreBtn = within(collectionRow.parentElement).getByTestId('icon-more').closest('button');
        fireEvent.click(moreBtn);

        const addReqBtn = screen.getByText('Add Request');
        fireEvent.click(addReqBtn);

        await waitFor(() => screen.getByText('New Request'));

        fireEvent.change(screen.getByPlaceholderText('My Request'), { target: { value: 'Test Req' } });

        // Find URL input accurately
        const urlInputs = screen.getAllByRole('textbox');
        const urlInput = urlInputs.find(i => i.placeholder && i.placeholder.includes('example.com')) || urlInputs[1];
        if (urlInput) fireEvent.change(urlInput, { target: { value: 'http://foo.bar' } });

        fireEvent.click(screen.getByText('Create', { selector: 'button' }));

        await waitFor(() => expect(screen.queryByText('New Request')).not.toBeInTheDocument());

        // Verify Save Button appears
        const saveIcon = within(collectionRow.parentElement).getByTestId('icon-save');
        fireEvent.click(saveIcon.closest('button'));

        await waitFor(() => {
            expect(apiService.createUpdateCollections).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Collection 1',
                requests: expect.arrayContaining([
                    expect.objectContaining({ name: 'Test Req' })
                ])
            }));
        });
    });

    it('edits an existing request and handles headers', async () => {
        const mockCollectionsWithReq = [{
            collectionId: 'c1',
            name: 'Collection 1',
            requests: [{
                requestId: 'r1',
                name: 'Existing Req',
                method: 'GET',
                url: 'http://old.com',
                headers: { 'Old-Header': 'OldValue' }
            }]
        }];

        apiService.getAllAppCodes.mockResolvedValue([
            {
                projectId: '101',
                projectName: 'Project A',
                moduleName: 'Module A',
                collections: mockCollectionsWithReq
            }
        ]);
        apiService.createUpdateCollections.mockResolvedValue({ collectionId: 'c1', requests: [] });

        await act(async () => {
            render(<EditDataPanel />);
        });

        await waitFor(() => screen.getByText('Project A'));

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.change(comboboxes[0], { target: { value: 'Project A' } });
        await waitFor(() => expect(comboboxes[1]).not.toBeDisabled());
        fireEvent.change(comboboxes[1], { target: { value: 'Module A' } });

        await waitFor(() => screen.getByText('Collection 1'));

        // Expand
        fireEvent.click(screen.getByText('Collection 1'));
        await waitFor(() => screen.getByText('Existing Req'));

        // Edit
        fireEvent.click(screen.getByText('Existing Req'));
        await waitFor(() => screen.getByText('Edit Request'));

        fireEvent.change(screen.getByDisplayValue('Existing Req'), { target: { value: 'Updated Req' } });
        fireEvent.click(screen.getByText('Save', { selector: 'button' }));

        const collectionRow = screen.getByText('Collection 1').closest('div');
        const saveIcon = within(collectionRow.parentElement).getByTestId('icon-save');
        fireEvent.click(saveIcon.closest('button'));

        await waitFor(() => {
            expect(apiService.createUpdateCollections).toHaveBeenCalledWith(expect.objectContaining({
                requests: expect.arrayContaining([
                    expect.objectContaining({ name: 'Updated Req' })
                ])
            }));
        }, { timeout: 3000 });
    });

});
