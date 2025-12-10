'use client'; // This file needs to be a client component for the redirect to work

import React, { useEffect } from 'react';

/**
 * This component renders at the /admin route.
 * Its only job is to redirect the user to the dashboard.
 *
 * We use a client-side redirect here for preview compatibility.
 * The original `redirect()` function is correct for your Next.js project.
 */
export default function AdminRootPage() {
    useEffect(() => {
        // Client-side redirect to the dashboard
        window.location.href = '/admin/dashboard';
    }, []); // Empty dependency array ensures this runs only once

    // Show a loading/redirecting message
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'sans-serif',
                fontSize: '1.2rem',
                color: '#888',
            }}
        >
            Redirecting to dashboard...
        </div>
    );
}