import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
    const tabs = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' }
    ];

    it('should render all tabs', () => {
        render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => { }} />);
        expect(screen.getByText('Tab 1')).toBeInTheDocument();
        expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should highlight the active tab', () => {
        render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => { }} />);
        const tab1 = screen.getByText('Tab 1').closest('button');
        const tab2 = screen.getByText('Tab 2').closest('button');

        expect(tab1).toHaveClass('text-red-600');
        expect(tab2).not.toHaveClass('text-red-600');
    });

    it('should call onTabChange when clicked', () => {
        const onTabChange = vi.fn();
        render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />);

        fireEvent.click(screen.getByText('Tab 2'));
        expect(onTabChange).toHaveBeenCalledWith('tab2');
    });
});
