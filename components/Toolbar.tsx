'use client';

import { ReactNode } from 'react';

interface ToolbarProps {
    children: ReactNode;
}

export default function Toolbar({ children }: ToolbarProps) {
    return (
        <div className="fixed z-20 top-12 left-0 right-0 h-12 flex justify-center">
            {children}
        </div>
    );
}
