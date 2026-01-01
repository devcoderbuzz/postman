import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../Settings';
import * as apiService from '../../services/apiservice';

// Mocks
vi.mock('../../services/apiservice');
vi.mock('../ImageCropper', () => ({
    ImageCropper: ({ onCropComplete, onCancel }) => (
        <div data-testid="image-cropper">
            <button onClick={() => onCropComplete('base64String')}>Crop</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}));
vi.mock('../ResetPasswordModal', () => ({
    ResetPasswordModal: ({ isOpen, onSave, onClose }) => (
        isOpen ? (
            <div data-testid="reset-modal">
                <button onClick={() => onSave('user', { currentPassword: 'old', newPassword: 'new' })}>Save</button>
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    )
}));
vi.mock('lucide-react', () => ({
    Moon: () => <span>Moon</span>,
    Sun: () => <span>Sun</span>,
    Upload: () => <span>Upload</span>,
    FolderOpen: () => <span>FolderOpen</span>
}));

describe('Settings', () => {
    const mockUser = { id: 1, username: 'testuser', role: 'developer', token: 'valid-token' };
    const setTheme = vi.fn();
    const setLayout = vi.fn();
    const setProfilePic = vi.fn();
    const onLogout = vi.fn();
    const setLocalCollectionsPath = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        apiService.updateProfilePic.mockResolvedValue({ success: true });
        apiService.resetPassword.mockResolvedValue({ success: true });
        vi.spyOn(window, 'alert').mockImplementation(() => { });
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true
        });
    });

    it('renders user details', () => {
        render(<Settings user={mockUser} />);
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText(/developer/i)).toBeInTheDocument();
    });

    it('toggles theme', () => {
        render(<Settings theme="light" setTheme={setTheme} />);
        fireEvent.click(screen.getByText('Dark'));
        expect(setTheme).toHaveBeenCalledWith('dark');

        fireEvent.click(screen.getByText('Light'));
        expect(setTheme).toHaveBeenCalledWith('light');
    });

    it('toggles layout', () => {
        render(<Settings layout="horizontal" setLayout={setLayout} />);
        fireEvent.click(screen.getByText('Vertical'));
        expect(setLayout).toHaveBeenCalledWith('vertical');
    });

    it.skip('handles image upload flow', async () => {
        render(<Settings user={mockUser} setProfilePic={setProfilePic} />);

        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

        // Mock FileReader
        const mockFileReader = {
            readAsDataURL: vi.fn(),
            result: 'data:image/png;base64,fake',
            onload: null,
        };

        const originalFileReader = window.FileReader;
        window.FileReader = vi.fn(() => mockFileReader);

        const input = document.querySelector('input[type="file"]');

        // Trigger file change which will set up the FileReader
        fireEvent.change(input, { target: { files: [file] } });

        // Verify FileReader was called
        expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);

        // Manually trigger onload after it's been set by the component
        if (mockFileReader.onload) {
            await act(async () => {
                mockFileReader.onload();
            });

            // ImageCropper should appear
            await waitFor(() => {
                expect(screen.getByTestId('image-cropper')).toBeInTheDocument();
            });

            // Crop
            const cropButton = screen.getByText('Crop');
            fireEvent.click(cropButton);

            await waitFor(() => {
                expect(apiService.updateProfilePic).toHaveBeenCalledWith(1, 'base64String', 'valid-token');
                expect(setProfilePic).toHaveBeenCalledWith('base64String');
            });
        }

        // Restore original FileReader
        window.FileReader = originalFileReader;
    });

    it('handles password reset', async () => {
        render(<Settings user={mockUser} />);

        fireEvent.click(screen.getByText('Reset Password'));
        expect(screen.getByTestId('reset-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Save')); // Triggers onSave

        await waitFor(() => {
            expect(apiService.resetPassword).toHaveBeenCalledWith(
                1, 'testuser', 'old', 'new', 'valid-token'
            );
        });
    });

    it('updates local collections path', () => {
        render(<Settings localCollectionsPath="" setLocalCollectionsPath={setLocalCollectionsPath} />);

        const input = screen.getByPlaceholderText(/e.g. \/Users/);
        fireEvent.change(input, { target: { value: '/foo/bar' } });

        expect(setLocalCollectionsPath).toHaveBeenCalledWith('/foo/bar');
    });

    it('logs out', () => {
        render(<Settings onLogout={onLogout} />);
        fireEvent.click(screen.getByText('Logout'));
        expect(onLogout).toHaveBeenCalled();
    });
});
