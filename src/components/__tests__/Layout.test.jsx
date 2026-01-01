import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from '../Layout';

// Mock Sidebar to isolate Layout testing
vi.mock('../Sidebar', () => ({
    Sidebar: ({ activeView }) => <div data-testid="sidebar">{activeView}</div>
}));

describe('Layout', () => {
    it('should render children and sidebar', () => {
        render(
            <Layout activeView="test-view" setActiveView={() => { }}>
                <div data-testid="content">Child Content</div>
            </Layout>
        );

        expect(screen.getByTestId('sidebar')).toHaveTextContent('test-view');
        expect(screen.getByTestId('content')).toHaveTextContent('Child Content');
    });
});
