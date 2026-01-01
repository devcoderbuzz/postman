import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyValueEditor } from '../KeyValueEditor';

describe('KeyValueEditor', () => {
    it('renders pairs correctly', () => {
        const pairs = [
            { key: 'Content-Type', value: 'application/json', active: true },
            { key: 'Authorization', value: 'Bearer token', active: true }
        ];
        const setPairs = vi.fn();

        render(<KeyValueEditor pairs={pairs} setPairs={setPairs} />);

        const inputs = screen.getAllByRole('textbox');
        // 2 pairs * 2 inputs (key + value) = 4 inputs
        expect(inputs).toHaveLength(4);
        expect(inputs[0]).toHaveValue('Content-Type');
        expect(inputs[1]).toHaveValue('application/json');
    });

    it('updates a key', () => {
        const pairs = [{ key: 'Foo', value: 'Bar', active: true }];
        const setPairs = vi.fn();

        render(<KeyValueEditor pairs={pairs} setPairs={setPairs} />);

        const keyInput = screen.getByDisplayValue('Foo');
        fireEvent.change(keyInput, { target: { value: 'FooUpdated' } });

        expect(setPairs).toHaveBeenCalledWith([
            { key: 'FooUpdated', value: 'Bar', active: true }
        ]);
    });

    it('adds a new pair', () => {
        const pairs = [];
        const setPairs = vi.fn();

        render(<KeyValueEditor pairs={pairs} setPairs={setPairs} />);

        const addButton = screen.getByText('Add new');
        fireEvent.click(addButton);

        expect(setPairs).toHaveBeenCalledWith([
            { key: '', value: '', active: true }
        ]);
    });

    it('removes a pair', () => {
        const pairs = [{ key: 'DeleteMe', value: '', active: true }];
        const setPairs = vi.fn();

        render(<KeyValueEditor pairs={pairs} setPairs={setPairs} />);

        // The remove button has opacity 0 but is clickable.
        // It contains Trash2 icon. We likely need to find it by role button inside the row.
        const buttons = screen.getAllByRole('button'); // Trash button + Add button
        // Trash button is likely first since it renders in the loop

        // Actually, let's target by finding the row first.
        const valueInput = screen.getByDisplayValue('DeleteMe');
        const row = valueInput.closest('div.flex');
        const deleteButton = row.querySelector('button');

        fireEvent.click(deleteButton);

        expect(setPairs).toHaveBeenCalledWith([]);
    });
});
