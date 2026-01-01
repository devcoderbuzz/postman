
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Settings } from '../Settings';
import { vi } from 'vitest';
import * as apiService from '../../services/apiservice';

vi.mock('../../services/apiservice', () => ({
    updateProfilePic: vi.fn(),
    resetPassword: vi.fn()
}));

vi.mock('../ImageCropper', () => ({
    ImageCropper: ({ onCropComplete, onCancel }) => (
        <div data-testid="image-cropper">
            <button onClick={() => onCropComplete('cropped-image-data')}>Confirm Crop</button>
            <button onClick={onCancel}>Cancel Crop</button>
        </div>
    )
}));

vi.mock('../ResetPasswordModal', () => ({
    ResetPasswordModal: ({ isOpen, onSave, onClose }) => isOpen ? (
        <div data-testid="reset-password-modal">
            <button onClick={() => onSave('username', { currentPassword: 'old', newPassword: 'new' })}>Save Password</button>
            <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

describe('Settings Extended', () => {
    const mockUser = { id: '1', username: 'testuser', token: 'token', role: 'user' };
    const mockSetTheme = vi.fn();
    const mockSetLayout = vi.fn();
    const mockSetProfilePic = vi.fn();
    const mockLogout = vi.fn();
    const mockSetLocalCollectionsPath = vi.fn();

    const defaultProps = {
        user: mockUser,
        theme: 'light',
        setTheme: mockSetTheme,
        layout: 'horizontal',
        setLayout: mockSetLayout,
        profilePic: '',
        setProfilePic: mockSetProfilePic,
        onLogout: mockLogout,
        localCollectionsPath: '',
        setLocalCollectionsPath: mockSetLocalCollectionsPath
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock FileReader
        global.FileReader = class {
            readAsDataURL() {
                this.result = 'data:image/png;base64,fake';
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 10);
            }
        };
        // Mock window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    it('toggles theme', () => {
        render(<Settings {...defaultProps} />);
        fireEvent.click(screen.getByText('Dark'));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');

        fireEvent.click(screen.getByText('Light'));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('toggles layout', () => {
        render(<Settings {...defaultProps} />);
        fireEvent.click(screen.getByText('Vertical'));
        expect(mockSetLayout).toHaveBeenCalledWith('vertical');
    });

    it('updates local collections path', () => {
        render(<Settings {...defaultProps} />);
        const input = screen.getByPlaceholderText('e.g. /Users/name/collections');
        fireEvent.change(input, { target: { value: '/new/path' } });
        expect(mockSetLocalCollectionsPath).toHaveBeenCalledWith('/new/path');
    });

    it('handles profile picture upload flow with mocks', async () => {
        const { container } = render(<Settings {...defaultProps} />);
        const fileInput = container.querySelector('input[type="file"]');

        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        // Wait for FileReader timeout
        await waitFor(() => {
            expect(screen.getByTestId('image-cropper')).toBeInTheDocument();
        });

        // Confirm crop
        await act(async () => {
            fireEvent.click(screen.getByText('Confirm Crop'));
        });

        expect(apiService.updateProfilePic).toHaveBeenCalledWith('1', 'cropped-image-data', 'token');
        expect(mockSetProfilePic).toHaveBeenCalledWith('cropped-image-data');
    });

    it('opens reset password modal and saves', async () => {
        render(<Settings {...defaultProps} />);

        const resetBtn = screen.getByText('Reset Password');
        fireEvent.click(resetBtn);

        expect(screen.getByTestId('reset-password-modal')).toBeInTheDocument();

        const saveBtn = screen.getByText('Save Password');
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(apiService.resetPassword).toHaveBeenCalledWith('1', 'testuser', 'old', 'new', 'token');
    });

    it('calls logout', () => {
        render(<Settings {...defaultProps} />);
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalled();
    });
});
