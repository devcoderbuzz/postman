import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext');

// Mock icons
vi.mock('lucide-react', () => ({
    History: () => <span data-testid="icon-history"></span>,
    LayoutGrid: () => <span data-testid="icon-layoutgrid"></span>,
    Settings: () => <span data-testid="icon-settings"></span>,
    Box: () => <span data-testid="icon-box"></span>,
    Folder: () => <span data-testid="icon-folder"></span>,
    Globe: () => <span data-testid="icon-globe"></span>,
    Database: () => <span data-testid="icon-database"></span>,
    Users: () => <span data-testid="icon-users"></span>,
    Shield: () => <span data-testid="icon-shield"></span>,
}));

describe('Sidebar', () => {
    const setActiveView = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders admin items', () => {
        useAuth.mockReturnValue({ user: { role: 'admin' } });
        render(<Sidebar activeView="users" setActiveView={setActiveView} />);

        expect(screen.getByTitle('Management')).toBeInTheDocument();
        expect(screen.getByTitle('Env')).toBeInTheDocument();
        expect(screen.getByTitle('Settings')).toBeInTheDocument();

        // Admin also sees My App Codes (mapped to 'appcodes')
        expect(screen.getByTitle('Collection Details')).toBeInTheDocument();

        // Admin does NOT see History/Collections in this logic?
        // Code: (!user || user.role !== 'admin') && (History/Folder)
        expect(screen.queryByTitle('History')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Collections')).not.toBeInTheDocument();
    });

    it('renders developer items', () => {
        useAuth.mockReturnValue({ user: { role: 'developer' } });
        render(<Sidebar activeView="history" setActiveView={setActiveView} />);

        expect(screen.getByTitle('History')).toBeInTheDocument();
        expect(screen.getByTitle('Collections')).toBeInTheDocument();
        expect(screen.getByTitle('My App Codes')).toBeInTheDocument(); // role !== 'user'
        expect(screen.queryByTitle('Management')).not.toBeInTheDocument();
    });

    it('renders user items', () => {
        useAuth.mockReturnValue({ user: { role: 'user' } });
        render(<Sidebar activeView="collections" setActiveView={setActiveView} />);

        expect(screen.getByTitle('History')).toBeInTheDocument();
        expect(screen.getByTitle('Collections')).toBeInTheDocument();
        // role === 'user' -> hide My App Codes
        expect(screen.queryByTitle('My App Codes')).not.toBeInTheDocument();
    });

    it('handles interactions', () => {
        useAuth.mockReturnValue({ user: { role: 'developer' } });
        render(<Sidebar activeView="history" setActiveView={setActiveView} />);

        fireEvent.click(screen.getByTitle('Collections'));
        expect(setActiveView).toHaveBeenCalledWith('collections');

        fireEvent.click(screen.getByTitle('Settings'));
        expect(setActiveView).toHaveBeenCalledWith('settings');

        // Click active view -> should not call
        vi.clearAllMocks();
        fireEvent.click(screen.getByTitle('History')); // history is active
        expect(setActiveView).not.toHaveBeenCalled();
    });
});
