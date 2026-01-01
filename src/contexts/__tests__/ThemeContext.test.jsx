import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <div data-testid="theme-value">{theme}</div>
            <button onClick={toggleTheme}>Toggle</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('should default to dark', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('should load theme from local storage', () => {
        localStorage.setItem('theme', 'light');
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('should toggle theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const button = screen.getByText('Toggle');
        act(() => {
            button.click();
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        expect(document.documentElement.dataset.theme).toBe('light');

        act(() => {
            button.click();
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });
});
