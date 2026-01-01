
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';

describe('ConfirmationModal', () => {
    it('renders correctly when open', () => {
        const handleClose = vi.fn();
        const handleConfirm = vi.fn();

        render(
            <ConfirmationModal
                isOpen={true}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title="Test Title"
                message="Test Message"
            />
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ConfirmationModal isOpen={false} />);
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        const handleClose = vi.fn();
        render(<ConfirmationModal isOpen={true} onClose={handleClose} title="Title" />);

        fireEvent.click(screen.getByText('Cancel'));
        expect(handleClose).toHaveBeenCalled();
    });

    it('calls onConfirm when confirm button clicked', () => {
        const handleConfirm = vi.fn();
        render(<ConfirmationModal isOpen={true} onConfirm={handleConfirm} title="Title" />);

        fireEvent.click(screen.getByText('Confirm'));
        expect(handleConfirm).toHaveBeenCalled();
    });
});
