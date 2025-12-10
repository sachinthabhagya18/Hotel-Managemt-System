'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Empty, Spin, App } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const API_URL = 'http://127.0.0.1:8000/api';

// --- MOCK ROUTER ---
// const useRouter = () => {
//     return {
//         push: (path) => {
//             if (typeof window !== 'undefined') {
//                 window.location.href = path;
//             }
//         }
//     };
// };

export default function BookingsListPage() {
    const router = useRouter();
    const { message: messageApi, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const fetchMyBookings = async () => {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/public/account');
                return;
            }

            const user = JSON.parse(userStr);
            const headers = { 'Authorization': `Token ${token}` };
            const userEmail = user.email || user.username;

            try {
                // 1. Find Guest ID
                const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(userEmail)}`, { headers });

                if (!guestRes.ok) {
                    if (guestRes.status === 401) {
                        router.push('/public/account');
                        return;
                    }
                    throw new Error('Failed to fetch profile');
                }

                const guestData = await guestRes.json();
                const results = guestData.results || guestData || [];

                if (results.length === 0) {
                    setLoading(false);
                    setBookings([]);
                    return;
                }

                const guestId = results[0].id;

                // 2. Fetch Bookings AND Room Types (for Images)
                const [bookingRes, roomTypesRes] = await Promise.all([
                    fetch(`${API_URL}/bookings/?guest=${guestId}`, { headers }),
                    fetch(`${API_URL}/room-types/`)
                ]);

                if (!bookingRes.ok) throw new Error("Failed to fetch bookings list");

                const bookingData = await bookingRes.json();
                const myBookings = bookingData.results || bookingData || [];

                // Handle Room Types for Images
                const roomTypesData = roomTypesRes.ok ? await roomTypesRes.json() : {};
                const roomTypes = roomTypesData.results || roomTypesData || [];

                // Map images to bookings
                const bookingsWithImages = myBookings.map(b => {
                    const type = roomTypes.find(rt => rt.id === b.room_type);
                    let imageUrl = null;
                    if (type?.image) {
                        // Ensure full URL if it's relative
                        imageUrl = type.image.startsWith('http') ? type.image : `http://127.0.0.1:8000${type.image}`;
                    }
                    return { ...b, imageUrl };
                });

                // Sort by most recent
                bookingsWithImages.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));

                setBookings(bookingsWithImages);

            } catch (error) {
                console.error("Booking fetch error:", error);
                messageApi.error('Could not load your bookings.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyBookings();
    }, []);

    const getStatusConfig = (status) => {
        const s = status ? status.toUpperCase() : 'UNKNOWN';
        switch (s) {
            case 'CONFIRMED': return { color: 'green', icon: <CheckCircleOutlined /> };
            case 'CHECKED_IN': return { color: 'purple', icon: <ClockCircleOutlined /> };
            case 'CANCELLED': return { color: 'red', icon: <CloseCircleOutlined /> };
            case 'PENDING': return { color: 'orange', icon: <ClockCircleOutlined /> };
            default: return { color: 'default', icon: null };
        }
    };

    const columns = [
        {
            title: 'Booking Ref',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <span className="font-medium text-slate-700">BK-{id}</span>,
        },
        // --- UPDATED: Room Column with Image ---
        {
            title: 'Room',
            key: 'room',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <img
                        src={record.imageUrl || `https://placehold.co/80x60/e2e8f0/475569?text=Room`}
                        alt="Room"
                        className="w-16 h-12 object-cover rounded shadow-sm border border-slate-200"
                    />
                    <div>
                        <Text strong className="block">{record.room_type_name || 'Standard Room'}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Dates',
            key: 'dates',
            render: (_, record) => (
                <div className="flex flex-col text-xs text-slate-500">
                    <span>In: {record.check_in}</span>
                    <span>Out: {record.check_out}</span>
                </div>
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total_price',
            key: 'total_price',
            render: (price) => <Text strong>${price}</Text>,
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status) => {
                const config = getStatusConfig(status);
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {status ? status.toUpperCase() : 'UNKNOWN'}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        modal.info({
                            title: `Booking Details: BK-${record.id}`,
                            width: 400,
                            content: (
                                <div className="mt-4">
                                    <img
                                        src={record.imageUrl || `https://placehold.co/400x200/e2e8f0/475569?text=${record.room_type_name}`}
                                        alt="Room"
                                        className="w-full h-32 object-cover rounded-lg mb-4"
                                    />
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Room Type:</strong> {record.room_type_name}</p>
                                        <p><strong>Check-in:</strong> {record.check_in}</p>
                                        <p><strong>Check-out:</strong> {record.check_out}</p>
                                        <p><strong>Status:</strong> <Tag color={getStatusConfig(record.status).color}>{record.status}</Tag></p>
                                        <p><strong>Total Paid:</strong> ${record.total_price}</p>
                                        {record.special_requests && (
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                                                <strong>Notes:</strong> {record.special_requests}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ),
                            maskClosable: true
                        });
                    }}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <Title level={3} style={{ margin: 0 }}>My Reservations</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="bg-indigo-600"
                    onClick={() => router.push('/public/account/bookings/new')}
                >
                    New Booking
                </Button>
            </div>

            <Card  className="shadow-sm rounded-xl overflow-hidden" >
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        {/* <Spin size="large" tip="Loading reservations..." /> */}
                    </div>
                ) : bookings.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={bookings}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                    />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="text-center">
                                <Text strong className="block mb-1">No bookings found</Text>
                                <Text type="secondary" className="text-xs">
                                    We couldn't find a guest profile linked to your account.
                                    <br />
                                    Try making a new booking to create your profile.
                                </Text>
                            </div>
                        }
                        className="py-12"
                    >
                        <Button type="primary" className="mt-4" onClick={() => router.push('/public/account/bookings/new')}>
                            Book Your First Stay
                        </Button>
                    </Empty>
                )}
            </Card>
        </div>
    );
}