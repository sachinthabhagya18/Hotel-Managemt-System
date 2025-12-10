'use client';

import React, { useEffect } from 'react';
// Uncomment these lines in your local Next.js project:
import { useRouter } from 'next/navigation';

/**
 * This is the root page of your application.
 * It immediately redirects all incoming traffic to the public homepage.
 */
export default function RootRedirectPage() {
    // const router = useRouter(); // Uncomment in local project

    useEffect(() => {
        // In a local Next.js project, use the router:
        // router.push('/public');

        // For simple redirect in preview environment:
        window.location.href = '/public';
    }, []);

    // Display a simple loading state while redirecting
    return (
        <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>
            Redirecting to Hotel Homepage...
        </div>
    );
}