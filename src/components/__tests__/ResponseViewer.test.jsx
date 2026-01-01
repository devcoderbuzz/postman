
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ResponseViewer } from '../ResponseViewer';
import { vi } from 'vitest';

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => {
    const MockLight = ({ children }) => <pre data-testid="syntax-highlighter">{children}</pre>;
    MockLight.registerLanguage = vi.fn();
    return { Light: MockLight };
});

// Mock buildCurl
vi.mock('../../lib/curlBuilder', () => ({
    buildCurl: (req) => `curl -X ${req.method} ${req.url}`
}));

// Mock Tabs
vi.mock('../Tabs', () => ({
    Tabs: ({ tabs, onTabChange }) => (
        <div>
            {tabs.map(t => (
                <button key={t.id} onClick={() => onTabChange(t.id)}>{t.label}</button>
            ))}
        </div>
    )
}));

describe('ResponseViewer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(),
            },
        });
        // Mock URL
        global.URL.createObjectURL = vi.fn(() => 'mock-url');
        global.URL.revokeObjectURL = vi.fn();
    });

    it('renders empty state', () => {
        render(<ResponseViewer response={null} error={null} isLoading={false} />);
        expect(screen.getByText('Send a request to see the response here')).toBeInTheDocument();
    });

    it('renders loading state', () => {
        render(<ResponseViewer response={null} error={null} isLoading={true} />);
        expect(screen.getByText('Sending request...')).toBeInTheDocument();
    });

    it('renders error state', () => {
        const error = { message: 'Network Error' };
        render(<ResponseViewer response={null} error={error} isLoading={false} />);
        expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('renders response body in pretty mode', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 123,
            size: 100,
            headers: { 'content-type': 'application/json' },
            data: { id: 1, name: 'Test' }
        };
        render(<ResponseViewer response={response} isLoading={false} />);

        expect(screen.getByText('200 OK')).toBeInTheDocument();
        expect(screen.getByText('⏱ 123ms')).toBeInTheDocument();

        const content = screen.getByTestId('syntax-highlighter').textContent;
        // Check for content allowing flexibility
        expect(content).toContain('"id": 1');
    });

    it('switches to raw mode', () => {
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { id: 1 }
        };
        render(<ResponseViewer response={response} isLoading={false} />);

        fireEvent.click(screen.getByText('raw'));

        const textarea = screen.getByRole('textbox');
        expect(textarea.value).toContain('"id": 1');
    });

    it('handles copy response', async () => {
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { id: 1 }
        };
        render(<ResponseViewer response={response} isLoading={false} />);

        const copyBtn = screen.getByTitle('Copy response');
        fireEvent.click(copyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(response.data, null, 2));
    });

    it('handles download response', async () => {
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { id: 1 }
        };
        render(<ResponseViewer response={response} isLoading={false} />);

        const downloadBtn = screen.getByTitle('Download response');
        fireEvent.click(downloadBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('renders headers tab', () => {
        const response = {
            status: 200,
            headers: { 'content-type': 'application/json', 'x-test': 'value' },
            data: {}
        };
        render(<ResponseViewer response={response} isLoading={false} />);

        fireEvent.click(screen.getByText('Headers'));

        expect(screen.getByText('x-test')).toBeInTheDocument();
        expect(screen.getByText('value')).toBeInTheDocument();
    });

    it('renders curl tab and copies', () => {
        const response = { status: 200, headers: {}, data: {} };
        const activeRequest = { method: 'GET', url: 'http://example.com' };
        render(<ResponseViewer response={response} activeRequest={activeRequest} isLoading={false} />);

        fireEvent.click(screen.getByText('Curl'));

        expect(screen.getByText('curl -X GET http://example.com')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Copy Curl'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('curl -X GET http://example.com');
    });
});
