import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SaveRequestModal } from '../SaveRequestModal';

vi.mock('lucide-react', () => ({
    X: () => <span data-testid="x-icon">X</span>
}));

describe('SaveRequestModal', () => {
    const mockCollections = [
        { id: '1', name: 'Collection 1' },
        { id: '2', name: 'Collection 2' }
    ];

    const onClose = vi.fn();
    const onSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <SaveRequestModal isOpen={false} onClose={onClose} onSave={onSave} collections={mockCollections} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders when isOpen is true', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        expect(screen.getByText('Save Request')).toBeInTheDocument();
    });

    it('renders collections in dropdown', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        expect(screen.getByText('Collection 1')).toBeInTheDocument();
        expect(screen.getByText('Collection 2')).toBeInTheDocument();
    });

    it('handles request name input', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const input = screen.getByPlaceholderText('e.g., Get User Profile');
        fireEvent.change(input, { target: { value: 'My Request' } });
        expect(input.value).toBe('My Request');
    });

    it('handles collection selection', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '1' } });
        expect(select.value).toBe('1');
    });

    it('shows alert when request name is empty', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
        expect(window.alert).toHaveBeenCalledWith('Please enter a request name');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('shows alert when collection is not selected', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const input = screen.getByPlaceholderText('e.g., Get User Profile');
        fireEvent.change(input, { target: { value: 'My Request' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
        expect(window.alert).toHaveBeenCalledWith('Please select a collection');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSave with correct arguments when valid', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);

        const input = screen.getByPlaceholderText('e.g., Get User Profile');
        fireEvent.change(input, { target: { value: 'My Request' } });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '1' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(onSave).toHaveBeenCalledWith('My Request', '1');
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Cancel is clicked', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const xButton = screen.getByTestId('x-icon').closest('button');
        fireEvent.click(xButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const backdrop = screen.getByText('Save Request').closest('.fixed');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
    });

    it('does not close when modal content is clicked', () => {
        render(<SaveRequestModal isOpen={true} onClose={onClose} onSave={onSave} collections={mockCollections} />);
        const modalContent = screen.getByText('Save Request').closest('div.bg-white');
        fireEvent.click(modalContent);
        expect(onClose).not.toHaveBeenCalled();
    });
});
