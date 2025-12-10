'use client';

import React, { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Row,
    Col,
    Button,
    Space,
    Statistic,
    message,
    App,
    Table,
    Divider
} from 'antd';
import {
    DownloadOutlined,
    PrinterOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    PieChartOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

import { usePathname, useRouter } from 'next/navigation';
const { Title, Text } = Typography;

// --- API & AUTH ---
const API_URL = 'http://127.0.0.1:8000/api';
// --- PASTE YOUR TOKEN HERE ---
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5';

// Colors for Pie Charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(true);

    // --- State for Processed Data ---
    const [financialData, setFinancialData] = useState([]);
    const [bookingStatusData, setBookingStatusData] = useState([]);
    const [roomStatusData, setRoomStatusData] = useState([]);

    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        totalBookings: 0
    });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Bookings, Payroll, AND Rooms
            const [bookingsRes, payrollRes, roomsRes] = await Promise.all([
                fetch(`${API_URL}/bookings/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } }),
                fetch(`${API_URL}/payroll/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } }),
                fetch(`${API_URL}/rooms/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } })
            ]);

            if (!bookingsRes.ok || !payrollRes.ok || !roomsRes.ok) throw new Error('Failed to fetch report data');

            const bookingsData = await bookingsRes.json();
            const payrollData = await payrollRes.json();
            const roomsData = await roomsRes.json();

            processAllData(
                bookingsData.results || [],
                payrollData.results || [],
                roomsData.results || []
            );

        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load report data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (AUTH_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
            message.error('Please paste your AUTH_TOKEN in reports/page.js');
            setLoading(false);
            return;
        }
        fetchData();
    }, []);

    // --- DATA PROCESSING LOGIC ---
    const processAllData = (bookings, payrolls, rooms) => {
        // 1. Process Financials (Monthly)
        const monthlyStats = {};

        bookings.forEach(b => {
            if (b.status !== 'CANCELLED') { // Count income unless cancelled
                const month = dayjs(b.check_in).format('YYYY-MM');
                if (!monthlyStats[month]) monthlyStats[month] = { income: 0, expense: 0, bookingsCount: 0, month };
                monthlyStats[month].income += parseFloat(b.total_price || 0);
                monthlyStats[month].bookingsCount += 1;
            }
        });

        payrolls.forEach(p => {
            const month = dayjs(p.payment_date).format('YYYY-MM');
            if (!monthlyStats[month]) monthlyStats[month] = { income: 0, expense: 0, bookingsCount: 0, month };
            monthlyStats[month].expense += (parseFloat(p.salary_amount || 0) + parseFloat(p.bonus_amount || 0));
        });

        const financialArray = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
        setFinancialData(financialArray);

        // Calculate Summary Totals
        const totals = financialArray.reduce((acc, curr) => ({
            totalIncome: acc.totalIncome + curr.income,
            totalExpense: acc.totalExpense + curr.expense,
            totalBookings: acc.totalBookings + curr.bookingsCount
        }), { totalIncome: 0, totalExpense: 0, totalBookings: 0 });

        setSummary({
            ...totals,
            netProfit: totals.totalIncome - totals.totalExpense
        });

        // 2. Process Booking Status Distribution
        const statusCounts = {};
        bookings.forEach(b => {
            const status = b.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        const bookingStatusArray = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
        setBookingStatusData(bookingStatusArray);

        // 3. Process Room Status Snapshot
        const roomCounts = {};
        rooms.forEach(r => {
            const status = r.status || 'Unknown';
            roomCounts[status] = (roomCounts[status] || 0) + 1;
        });
        const roomStatusArray = Object.keys(roomCounts).map(key => ({ name: key, value: roomCounts[key] }));
        setRoomStatusData(roomStatusArray);
    };

    // --- DOWNLOAD HANDLERS ---
    const handleDownloadCSV = () => {
        if (financialData.length === 0) {
            message.warning('No data to download');
            return;
        }

        const headers = ['Month', 'Income', 'Expense', 'Profit', 'Bookings Count'];
        const rows = financialData.map(item => [
            item.month,
            item.income.toFixed(2),
            item.expense.toFixed(2),
            (item.income - item.expense).toFixed(2),
            item.bookingsCount
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'financial_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="reports-container" style={{ paddingBottom: 50 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Reports & Analytics</Title>
                    <Text type="secondary">Financial and Operational Overview</Text>
                </div>
                <Space>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadCSV}>
                        Export CSV
                    </Button>
                </Space>
            </div>

            {/* --- 1. FINANCIAL SUMMARY --- */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                    <Card variant={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                        <Statistic
                            title="Total Income"
                            value={summary.totalIncome}
                            precision={2}
                            prefix="LKR"
                            valueStyle={{ color: '#3f8600' }}
                            suffix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant={false} style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
                        <Statistic
                            title="Total Expenses"
                            value={summary.totalExpense}
                            precision={2}
                            prefix="LKR"
                            valueStyle={{ color: '#cf1322' }}
                            suffix={<ArrowDownOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant={false} style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                        <Statistic
                            title="Net Profit"
                            value={summary.netProfit}
                            precision={2}
                            prefix="LKR"
                            valueStyle={{ color: summary.netProfit >= 0 ? '#1890ff' : '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card variant={false}>
                        <Statistic
                            title="Total Bookings"
                            value={summary.totalBookings}
                            prefix={<LineChartOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* --- 2. MAIN CHARTS --- */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card title="Income vs Expense (Monthly)" loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#3f8600" />
                                    <Bar dataKey="expense" name="Expense" fill="#cf1322" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Booking Volume Trend" loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="bookingsCount" name="Bookings" stroke="#1890ff" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Divider />

            {/* --- 3. DISTRIBUTION CHARTS --- */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card title="Booking Status Distribution" loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={bookingStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {bookingStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Current Room Status Snapshot" loading={loading}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={roomStatusData}
                                        cx="50%"
                                        cy="50%"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#82ca9d"
                                        dataKey="value"
                                    >
                                        {roomStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* --- 4. DETAILED DATA TABLE --- */}
            <Card title="Monthly Financial Breakdown" style={{ marginTop: 24 }}>
                <Table
                    dataSource={financialData}
                    rowKey="month"
                    pagination={false}
                    columns={[
                        { title: 'Month', dataIndex: 'month', key: 'month' },
                        { title: 'Total Bookings', dataIndex: 'bookingsCount', key: 'bookingsCount' },
                        { title: 'Income', dataIndex: 'income', key: 'income', render: val => <span style={{ color: '#3f8600' }}>LKR {val.toFixed(2)}</span> },
                        { title: 'Expense', dataIndex: 'expense', key: 'expense', render: val => <span style={{ color: '#cf1322' }}>LKR {val.toFixed(2)}</span> },
                        {
                            title: 'Net Profit',
                            key: 'profit',
                            render: (_, r) => {
                                const val = r.income - r.expense;
                                return <span style={{ color: val >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>LKR {val.toFixed(2)}</span>;
                            }
                        }
                    ]}
                />
            </Card>
        </div>
    );
}