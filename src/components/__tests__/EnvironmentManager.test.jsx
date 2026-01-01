import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnvironmentManager } from '../EnvironmentManager';

// Mock icons
vi.mock('lucide-react', () => ({
    Globe: () => <span data-testid="globe-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    Edit2: () => <span data-testid="edit-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
    Check: () => <span data-testid="check-icon" />
}));

describe('EnvironmentManager', () => {
    it('renders empty state', () => {
        render(<EnvironmentManager environments={[]} />);
        expect(screen.getByText('No environments yet')).toBeInTheDocument();
    });

    it('renders list of environments', () => {
        const envs = [
            { id: '1', name: 'Dev', variables: [] },
            { id: '2', name: 'Prod', variables: [] }
        ];
        render(<EnvironmentManager environments={envs} activeEnv="1" />);

        expect(screen.getByText('Dev')).toBeInTheDocument();
        expect(screen.getByText('Prod')).toBeInTheDocument();
    });

    it('adds environment', () => {
        const setEnvironments = vi.fn();
        const setActiveEnv = vi.fn();
        render(<EnvironmentManager environments={[]} setEnvironments={setEnvironments} setActiveEnv={setActiveEnv} />);

        const addBtn = screen.getByTitle('Add Environment');
        fireEvent.click(addBtn);

        expect(setEnvironments).toHaveBeenCalled();
        expect(setActiveEnv).toHaveBeenCalled();
    });

    it('activates environment', () => {
        const envs = [{ id: '1', name: 'Dev' }];
        const setActiveEnv = vi.fn();
        render(<EnvironmentManager environments={envs} setActiveEnv={setActiveEnv} />);

        fireEvent.click(screen.getByText('Dev'));
        expect(setActiveEnv).toHaveBeenCalledWith('1');
    });

    it('renames environment', () => {
        const envs = [{ id: '1', name: 'Dev' }];
        const setEnvironments = vi.fn();
        render(<EnvironmentManager environments={envs} setEnvironments={setEnvironments} />);

        // Edit button is hidden by default (opacity-0 group-hover:opacity-100)
        // usage: click the edit button
        const editBtn = screen.getByTitle('Rename');
        fireEvent.click(editBtn);

        // Should show input
        const input = screen.getByDisplayValue('Dev');
        fireEvent.change(input, { target: { value: 'Staging' } });

        // Confirm
        const checkBtn = screen.getByTestId('check-icon').closest('button');
        fireEvent.click(checkBtn);
        // OR press Enter (logic handles enter)

        // updateEnvName calls setEnvironments with updated list
        expect(setEnvironments).toHaveBeenCalledWith([{ id: '1', name: 'Staging' }]);
    });

    it('deletes environment', () => {
        const envs = [{ id: '1', name: 'Dev' }];
        const setEnvironments = vi.fn();
        render(<EnvironmentManager environments={envs} setEnvironments={setEnvironments} />);

        const deleteBtn = screen.getByTitle('Delete');
        fireEvent.click(deleteBtn);

        expect(setEnvironments).toHaveBeenCalledWith([]);
    });
});
