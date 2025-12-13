import React from 'react';
import { cn } from '../lib/utils';

export function Header() {
    return (
        <header className={cn('flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-[var(--bg-secondary)] border-b border-neutral-200 dark:border-[var(--border-color)]')}>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Postman Clone</h1>
        </header>
    );
}
