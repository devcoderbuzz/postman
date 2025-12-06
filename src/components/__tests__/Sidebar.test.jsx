import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import React from 'react';
import { vi } from 'vitest';

describe('Sidebar component', () => {
    test('renders Collections button when activeView is collections', () => {
        const setActiveView = vi.fn();
        render(<Sidebar activeView="collections" setActiveView={setActiveView} />);
        const collectionsButton = screen.getByTitle('Collections');
        expect(collectionsButton).toBeInTheDocument();
    });
});
