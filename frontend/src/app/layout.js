'use client';

import React from 'react';
// The AntdRegistry is necessary to correctly apply Ant Design styles
// and avoid the flash of unstyled content (FOUC).
import AntdRegistry from './AntdRegistry';
import { usePathname, useRouter } from 'next/navigation';
/**
 * The Root Layout component. 
 * This file is required by Next.js and wraps the entire application (including <head> and <body> tags).
 */
export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>StaySync Hotel Management</title>
                <meta name="description" content="A comprehensive hotel management and public booking system." />
            </head>
            <body cz-shortcut-listen="true">
                {/* The AntdRegistry wraps the children to provide Ant Design theming/styling context. */}
                <AntdRegistry>
                    {children}
                </AntdRegistry>
            </body>
        </html>
    );
}