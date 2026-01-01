import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportModal } from '../ImportModal';

vi.mock('lucide-react', () => ({
    X: () => <span data-testid="x-icon">X</span>
}));

describe('ImportModal', () => {
    const onClose = vi.fn();
    const onImport = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(<ImportModal isOpen={false} onClose={onClose} onImport={onImport} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders when isOpen is true', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        expect(screen.getAllByText('Import')[0]).toBeInTheDocument();
    });

    it('defaults to collection import type', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const collectionRadio = screen.getByLabelText(/Collection \(JSON\)/i);
        expect(collectionRadio).toBeChecked();
    });

    it('switches to curl import type', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const curlRadio = screen.getByLabelText(/cURL/i);
        fireEvent.click(curlRadio);
        expect(curlRadio).toBeChecked();
    });

    it('defaults to text input type', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        expect(screen.getByText('Paste Text')).toHaveClass('text-red-600');
    });

    it('switches to file input type', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const fileButton = screen.getByText('Upload File');
        fireEvent.click(fileButton);
        expect(fileButton).toHaveClass('text-red-600');
        expect(screen.getByText('Click to upload file')).toBeInTheDocument();
    });

    it('handles text input change', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const textarea = screen.getByPlaceholderText(/Paste Postman Collection JSON here/i);
        fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });
        expect(textarea.value).toBe('{"test": "data"}');
    });

    it('changes placeholder when switching to curl', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const curlRadio = screen.getByLabelText(/cURL/i);
        fireEvent.click(curlRadio);
        expect(screen.getByPlaceholderText(/Paste cURL command here/i)).toBeInTheDocument();
    });

    it('handles file selection', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        fireEvent.click(screen.getByText('Upload File'));

        const file = new File(['{"test": "data"}'], 'collection.json', { type: 'application/json' });
        const input = document.querySelector('#file-upload');

        fireEvent.change(input, { target: { files: [file] } });
        expect(screen.getByText('collection.json')).toBeInTheDocument();
    });

    it('calls onImport with text data', async () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);

        const textarea = screen.getByPlaceholderText(/Paste Postman Collection JSON here/i);
        fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });

        const buttons = screen.getAllByRole('button');
        const importButton = buttons.find(btn => btn.textContent === 'Import');
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(onImport).toHaveBeenCalledWith('collection', '{"test": "data"}');
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('calls onImport with file data', async () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        fireEvent.click(screen.getByText('Upload File'));

        const fileContent = '{"test": "file data"}';
        const file = new File([fileContent], 'collection.json', { type: 'application/json' });
        // Add text() method to File object
        file.text = vi.fn().mockResolvedValue(fileContent);

        const input = document.querySelector('#file-upload');

        fireEvent.change(input, { target: { files: [file] } });

        const buttons = screen.getAllByRole('button');
        const importButton = buttons.find(btn => btn.textContent === 'Import');
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(onImport).toHaveBeenCalledWith('collection', fileContent);
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('does not call onImport when no data is provided', async () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);

        const buttons = screen.getAllByRole('button');
        const importButton = buttons.find(btn => btn.textContent === 'Import');
        fireEvent.click(importButton);

        expect(onImport).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel is clicked', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const xButton = screen.getByTestId('x-icon').closest('button');
        fireEvent.click(xButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('shows correct file accept types for collection', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        fireEvent.click(screen.getByText('Upload File'));
        const input = document.querySelector('#file-upload');
        expect(input.accept).toBe('.json');
    });

    it('shows correct file accept types for curl', () => {
        render(<ImportModal isOpen={true} onClose={onClose} onImport={onImport} />);
        const curlRadio = screen.getByLabelText(/cURL/i);
        fireEvent.click(curlRadio);
        fireEvent.click(screen.getByText('Upload File'));
        const input = document.querySelector('#file-upload');
        expect(input.accept).toBe('.txt,.sh');
    });
});
