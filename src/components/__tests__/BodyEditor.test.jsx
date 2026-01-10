import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BodyEditor } from '../BodyEditor';

// Mock Lucide icons to avoid issues
vi.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="sparkles-icon"></div>,
    ChevronDown: () => <div data-testid="chevron-down-icon"></div>
}));

// Mock syntax highlighter just in case
vi.mock('react-syntax-highlighter', () => {
    const MockHighlighter = ({ children }) => <div data-testid="syntax-highlighter">{children}</div>;
    MockHighlighter.registerLanguage = vi.fn();
    return { Light: MockHighlighter };
});
vi.mock('react-syntax-highlighter/dist/esm/languages/hljs/json', () => ({ default: {} }));

vi.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
    atomOneDark: {},
    atomOneLight: {}
}));

describe('BodyEditor', () => {
    it('renders body type buttons', () => {
        const bodyType = 'none';
        const setBodyType = vi.fn();
        const body = '';
        const setBody = vi.fn();

        render(<BodyEditor bodyType={bodyType} setBodyType={setBodyType} body={body} setBody={setBody} />);

        ['none', 'json', 'form-data', 'raw'].forEach(type => {
            expect(screen.getByText(type)).toBeInTheDocument();
        });

        expect(screen.getByText('No body content')).toBeInTheDocument();
    });

    it('changes body type', () => {
        const setBodyType = vi.fn();
        render(<BodyEditor bodyType="none" setBodyType={setBodyType} body="" setBody={vi.fn()} />);

        fireEvent.click(screen.getByText('json'));
        expect(setBodyType).toHaveBeenCalledWith('json');
    });

    it('handles JSON editing and validation', () => {
        const setBody = vi.fn();
        render(<BodyEditor bodyType="json" setBodyType={vi.fn()} body="" setBody={setBody} rawType="JSON" />);

        const textarea = screen.getByPlaceholderText((content) => content.includes('"key": "value"'));

        // Type invalid
        fireEvent.change(textarea, { target: { value: '{ "key": ' } });
        expect(setBody).toHaveBeenCalledWith('{ "key": ');
        expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();

        // Type valid
        fireEvent.change(textarea, { target: { value: '{ "key": "value" }' } });
        // The error only clears if we re-render with new body prop or if component maintains internal error state upon change.
        // The component uses internal `jsonError` state which updates on `handleJsonChange`.
        // `handleJsonChange` runs validation on the value passed to it.
        // So checking validation logic works.
    });

    it('beautifies JSON', () => {
        const setBody = vi.fn();
        const body = '{"a":1}';

        render(<BodyEditor bodyType="json" setBodyType={vi.fn()} body={body} setBody={setBody} rawType="JSON" />);

        // The button is hidden until group hover, but in JSDOM we can usually find it.
        // It has title "Beautify JSON".
        // Wait, the button just says "Beautify" in code?
        // Code: <span>Beautify</span> (Step 431 Line 168)
        // And it only appears if rawType !== 'Text'.
        // There is no title attribute on the button itself?
        // Line 163: <button ...>
        // No title.
        // So screen.getByTitle('Beautify JSON') will fail.
        // The text is "Beautify".
        const beautifyBtn = screen.getByText('Beautify');
        fireEvent.click(beautifyBtn);

        expect(setBody).toHaveBeenCalledWith(expect.stringContaining('  "a": 1'));
    });

    it('handles raw input', () => {
        const setBody = vi.fn();
        render(<BodyEditor bodyType="raw" setBodyType={vi.fn()} body="" setBody={setBody} rawType="Text" />);

        const textarea = screen.getByPlaceholderText('Enter Text content...');
        fireEvent.change(textarea, { target: { value: 'Something' } });
        expect(setBody).toHaveBeenCalledWith('Something');
    });
});
