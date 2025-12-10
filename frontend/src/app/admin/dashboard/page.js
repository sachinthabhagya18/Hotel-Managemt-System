'use client';

import React, { useState, useEffect } from 'react';
import {
    Layout, Card, Row, Col, Statistic, Table, Tag,
    Typography, Spin, message, Button, Avatar, Progress, List, Divider
} from 'antd';
import {
    UserOutlined, ShoppingCartOutlined, DollarCircleOutlined,
    CheckCircleOutlined, ClockCircleOutlined, LogoutOutlined,
    HomeOutlined, BellOutlined, CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
// Import Recharts for Data Visualization
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const { Title, Text } = Typography;

// --- MOCK NAVIGATION ---
const useRouter = () => {
    return {
        push: (path) => {
            if (typeof window !== 'undefined') {
                window.location.href = path;
            }
        }
    };
};

const API_URL = 'http://127.0.0.1:8000/api';

// Chart Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Live Data State
    const [stats, setStats] = useState({
        revenue: 0,
        occupancyRate: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        checkInsToday: 0,
        checkOutsToday: 0,
        pendingTasks: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [roomStatusData, setRoomStatusData] = useState([]);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [roomTypeDistribution, setRoomTypeDistribution] = useState([]);

    // --- 1. SECURITY & DATA FETCHING ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');

        // if (!token) {
        //     message.error("Session expired. Please log in again.");
        //     router.push('/admin/login');
        //     return;
        // }

        setIsAuthorized(true);

        const fetchDashboardData = async () => {
            try {
                const headers = { 'Authorization': `Token ${token}` };

                const [bookingsRes, roomsRes, tasksRes] = await Promise.all([
                    fetch(`${API_URL}/bookings/`, { headers }),
                    fetch(`${API_URL}/rooms/`, { headers }),
                    fetch(`${API_URL}/housekeeping/`, { headers })
                ]);

                if (bookingsRes.status === 401) {
                    localStorage.removeItem('authToken');
                    router.push('/admin/login');
                    return;
                }

                const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { results: [] };
                const roomsData = roomsRes.ok ? await roomsRes.json() : { results: [] };
                const tasksData = tasksRes.ok ? await tasksRes.json() : { results: [] };

                const bookings = bookingsData.results || bookingsData || [];
                const rooms = roomsData.results || roomsData || [];
                const tasks = tasksData.results || tasksData || [];

                // --- 1. CALCULATE KPI STATS ---
                const totalRevenue = bookings
                    .filter(b => b.status !== 'CANCELLED')
                    .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

                const totalRooms = rooms.length || 1;
                const cleanRooms = rooms.filter(r => r.status === 'CLEAN').length;
                const dirtyRooms = rooms.filter(r => r.status === 'DIRTY').length;
                const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;

                const activeBookings = bookings.filter(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED').length;
                const occupancyRate = Math.round((activeBookings / totalRooms) * 100);

                const today = new Date().toISOString().split('T')[0];
                const checkIns = bookings.filter(b => b.check_in === today).length;
                const checkOuts = bookings.filter(b => b.check_out === today).length;

                setStats({
                    revenue: totalRevenue,
                    occupancyRate: Math.min(occupancyRate, 100),
                    totalRooms,
                    occupiedRooms: activeBookings,
                    checkInsToday: checkIns,
                    checkOutsToday: checkOuts,
                    pendingTasks: tasks.filter(t => t.status !== 'CLEAN').length + dirtyRooms
                });

                setRecentBookings(bookings.slice(0, 5));

                // --- 2. CHART DATA: ROOM STATUS (PIE) ---
                setRoomStatusData([
                    { name: 'Clean', value: cleanRooms, color: '#52c41a' },
                    { name: 'Dirty', value: dirtyRooms, color: '#faad14' },
                    { name: 'Maintenance', value: maintenanceRooms, color: '#ff4d4f' },
                    { name: 'Occupied', value: activeBookings, color: '#1890ff' },
                ]);

                // --- 3. CHART DATA: REVENUE TREND (AREA) ---
                // Group bookings by check_in date and sum total_price
                const revenueMap = {};
                bookings.forEach(booking => {
                    if (booking.status !== 'CANCELLED') {
                        const date = booking.check_in; // Or created_at if available
                        const amount = parseFloat(booking.total_price || 0);
                        if (revenueMap[date]) {
                            revenueMap[date] += amount;
                        } else {
                            revenueMap[date] = amount;
                        }
                    }
                });

                // Convert map to array and sort by date (Last 7 days logic could be applied here)
                const sortedRevenue = Object.keys(revenueMap)
                    .sort()
                    .slice(-7) // Take only the last 7 entries for cleaner chart
                    .map(date => ({
                        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: revenueMap[date]
                    }));

                setRevenueTrend(sortedRevenue.length > 0 ? sortedRevenue : [{ name: 'No Data', revenue: 0 }]);

                // --- 4. CHART DATA: BOOKINGS BY TYPE (BAR) ---
                const typeMap = {};
                bookings.forEach(booking => {
                    const typeName = booking.room_type_name || 'Unknown';
                    if (typeMap[typeName]) {
                        typeMap[typeName] += 1;
                    } else {
                        typeMap[typeName] = 1;
                    }
                });

                const sortedTypes = Object.keys(typeMap).map(name => ({
                    name: name,
                    value: typeMap[name]
                }));

                setRoomTypeDistribution(sortedTypes.length > 0 ? sortedTypes : [{ name: 'No Bookings', value: 0 }]);

            } catch (error) {
                console.error("Dashboard Data Error:", error);
                message.warning("Could not load live data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const columns = [
        {
            title: 'Guest',
            dataIndex: 'guest_name',
            key: 'guest_name',
            render: (text) => (
                <div className="flex items-center">
                    <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} size="small" className="mr-2" />
                    <Text strong>{text || 'Guest'}</Text>
                </div>
            ),
        },
        {
            title: 'Room Type',
            dataIndex: 'room_type_name',
            key: 'room_type_name',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'CONFIRMED') color = 'green';
                if (status === 'PENDING') color = 'orange';
                if (status === 'CANCELLED') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Amount',
            dataIndex: 'total_price',
            key: 'total_price',
            render: (price) => <Text strong>LKR {price}</Text>,
        }
    ];

    if (!isAuthorized) return null;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                {/* <Spin size="large" tip="Gathering Hotel Analytics..." /> */}
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Executive Dashboard</Title>
                    <Text type="secondary">
                        <CalendarOutlined className="mr-2" />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Button onClick={() => router.push('/admin/rooms')}>Manage Inventory</Button>
                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={() => {
                            localStorage.removeItem('authToken');
                            router.push('/admin/login');
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* --- KEY METRICS --- */}
            <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card variant={false} className="shadow-sm rounded-xl h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title="Total Revenue"
                            value={stats.revenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: '24px' }}
                            prefix={<DollarCircleOutlined />}
                            suffix="LKR"
                        />
                        <Text type="secondary" className="text-xs mt-2 block">All time revenue</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant={false} className="shadow-sm rounded-xl h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title="Occupancy"
                            value={stats.occupancyRate}
                            suffix="%"
                            valueStyle={{ color: stats.occupancyRate > 80 ? '#faad14' : '#1677ff', fontWeight: 'bold', fontSize: '24px' }}
                            prefix={<HomeOutlined />}
                        />
                        <Progress percent={stats.occupancyRate} showInfo={false} strokeColor={stats.occupancyRate > 80 ? '#faad14' : '#1677ff'} size="small" className="mt-2" />
                        <Text type="secondary" className="text-xs mt-1 block">{stats.occupiedRooms} / {stats.totalRooms} Rooms</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant={false} className="shadow-sm rounded-xl h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title="Check-Ins Today"
                            value={stats.checkInsToday}
                            valueStyle={{ color: '#722ed1', fontWeight: 'bold', fontSize: '24px' }}
                            prefix={<UserOutlined />}
                        />
                        <div className="flex justify-between items-center mt-2 text-slate-500 text-sm">
                            <span>Check-Outs:</span>
                            <span className="font-bold text-slate-700">{stats.checkOutsToday}</span>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant={false} className="shadow-sm rounded-xl h-full hover:shadow-md transition-shadow">
                        <Statistic
                            title="Tasks Pending"
                            value={stats.pendingTasks}
                            valueStyle={{ color: '#cf1322', fontWeight: 'bold', fontSize: '24px' }}
                            prefix={<ClockCircleOutlined />}
                        />
                        <div className="flex items-center mt-2 text-red-500 font-medium">
                            <ArrowUpOutlined className="mr-1" />
                            <span>High Priority</span>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* --- CHARTS SECTION --- */}
            <Row gutter={[24, 24]} className="mb-8">
                {/* Revenue Trend Chart */}
                <Col xs={24} lg={16}>
                    <Card title="Revenue Timeline" variant={false} className="shadow-sm rounded-xl">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Room Status Pie Chart */}
                <Col xs={24} lg={8}>
                    <Card title="Current Room Status" variant={false} className="shadow-sm rounded-xl">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roomStatusData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roomStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* --- RECENT ACTIVITY & SOURCE --- */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title="Recent Reservations"
                        variant={false}
                        className="shadow-sm rounded-xl"
                        extra={<Button type="link" onClick={() => router.push('/admin/bookings')}>View All</Button>}
                    >
                        <Table
                            dataSource={recentBookings}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Bookings by Type" variant={false} className="shadow-sm rounded-xl">
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={roomTypeDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                        {roomTypeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <Divider />
                        <div className="text-center">
                            <Text type="secondary">Distribution of total bookings per category.</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}