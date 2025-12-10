'use client'
import Link from "next/link";
import { usePathname } from 'next/navigation';
export default function DashboardSlider() {
    const pathname = usePathname();
    return (
        <main>
            <div className="sidebar-sticky pt-3">
                <h4 className="sidebar-heading px-3 mb-3 text-muted">Dashboard</h4>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <Link
                            href="/user/dashboard"
                            className={`nav-link ${pathname == '/user/dashboard' ? 'active bg-primary text-white rounded' : ''}`}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            href="/user/booking_history"
                            className={`nav-link ${pathname == '/user/booking_history' ? 'active bg-primary text-white rounded' : ''}`}
                        >
                            Booking history
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            href="/user/event_booking_history"
                            className={`nav-link ${pathname == '/user/event_booking_history' ? 'active bg-primary text-white rounded' : ''}`}
                        >
                            Event Booking history
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            href="/user/payment_logs"
                            className={`nav-link ${pathname == '/user/payment_logs' ? 'active bg-primary text-white rounded' : ''}`}
                        >
                            Payment logs
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            href="/user/update_profile"
                            className={`nav-link ${pathname == '/user/update_profile' ? 'active bg-primary text-white rounded' : ''}`}
                        >
                            Update profile
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link href="/logout" className="nav-link text-danger">
                            Logout
                        </Link>
                    </li>
                </ul>
            </div>
        </main>
    );
}
