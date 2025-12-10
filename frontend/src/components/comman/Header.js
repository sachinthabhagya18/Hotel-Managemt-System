'use client'
import Link from "next/link";
import { useEffect, useState } from 'react';

export default function Header() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This runs only on client side after component mounts
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="navbar-placeholder" style={{ height: '56px' }}></div>;
    }

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme='dark' style={{ backgroundColor: '#550059' }}>
            <div className="container">
                <Link className="navbar-brand fs-4" href="/">HMS</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item m-2">
                            <Link className="nav-link active" aria-current="page" href="/">Home</Link>
                        </li>
                        <li className="nav-item m-2">
                            <Link className="nav-link" href="/gallery">Gallery</Link>
                        </li>
                        <li className="nav-item m-2">
                            <Link className="nav-link" href="/room_type">Rooms</Link>
                        </li>
                        <li className="nav-item m-2">
                            <Link className="nav-link" href="/about_us">About Us</Link>
                        </li>
                        <li className="nav-item m-2">
                            <Link className="nav-link" href="/contact_us">Contact Us</Link>
                        </li>
                        {!user?.mobile && (
                            <li className="nav-item m-2">
                                <Link className="btn btn-dark btn-sm mt-2" href="/user/signup">Sign Up</Link>
                            </li>
                        )}
                        {user?.mobile && (
                            <>
                                <li className="nav-item m-2">
                                    <Link className="btn btn-danger btn-sm mt-2" href="/user/logout">Log Out</Link>
                                </li>
                                <li className="nav-item m-2">
                                    <Link className="btn btn-primary btn-sm mt-2" href="/book_event">Book Events</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}