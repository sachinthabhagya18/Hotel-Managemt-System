'use client';

import React, { useState, useEffect } from 'react';
// 1. Import 'App' and remove 'message' from the static imports
import {
    Table, Typography, Tag, Select, Card, Space, Button, Input, DatePicker, App
} from 'antd';
import {
    CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,
    SearchOutlined, ReloadOutlined, DollarCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminPaymentsPage() {
    // 2. Get the message instance from the App context
    const { message } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [searchText, setSearchText] = useState('');

    // --- FETCH DATA ---
    const fetchPayments = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/payments/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayments(data.results || data || []);
            }
        } catch (error) {
            message.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // --- UPDATE STATUS ---
    const handleStatusChange = async (id, newStatus) => {
        const token = localStorage.getItem('authToken');
        // Optimistic update
        const originalData = [...payments];
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

        try {
            const res = await fetch(`${API_URL}/payments/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error("Failed");
            // 3. This message.success will now work correctly
            message.success(`Payment #${id} marked as ${newStatus}`);
        } catch (error) {
            message.error("Update failed");
            setPayments(originalData); // Revert on error
        }
    };

    // --- UI HELPERS ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'FAILED': return 'error';
            case 'REFUNDED': return 'purple';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text strong>#{id}</Text>,
            width: 80,
        },
        {
            title: 'Guest',
            dataIndex: 'guest_name',
            key: 'guest',
            render: (text) => text || 'Unknown Guest',
        },
        {
            title: 'Invoice',
            dataIndex: 'invoice_number',
            key: 'invoice',
            render: (id) => <Tag>INV-{id}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => <Text strong>LKR {parseFloat(amount).toFixed(2)}</Text>,
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            filters: [
                { text: 'Credit Card', value: 'CARD' },
                { text: 'Cash', value: 'CASH' },
                { text: 'PayHere', value: 'PAYHERE' },
            ],
            onFilter: (value, record) => record.method.includes(value),
            render: (method) => <Tag>{method}</Tag>
        },
        {
            title: 'Date',
            dataIndex: 'payment_date',
            key: 'date',
            render: (date) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.payment_date) - new Date(b.payment_date),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 140 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    status={status === 'FAILED' ? 'error' : ''}
                >
                    <Option value="PENDING">
                        <Space><SyncOutlined spin /> Pending</Space>
                    </Option>
                    <Option value="COMPLETED">
                        <Space><CheckCircleOutlined className="text-green-500" /> Completed</Space>
                    </Option>
                    <Option value="FAILED">
                        <Space><CloseCircleOutlined className="text-red-500" /> Failed</Space>
                    </Option>
                    <Option value="REFUNDED">
                        <Space><DollarCircleOutlined className="text-purple-500" /> Refunded</Space>
                    </Option>
                </Select>
            )
        },
    ];

    // Filter logic
    const filteredData = payments.filter(item =>
        item.guest_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.id.toString().includes(searchText) ||
        item.invoice_number?.toString().includes(searchText)
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Payment Transactions</Title>
                    <Text type="secondary">Monitor revenue and manage payment statuses.</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchPayments}>Refresh</Button>
                    <Button type="primary">Export Report</Button>
                </Space>
            </div>

            <Card className="shadow-sm rounded-xl border-slate-200">
                <div className="mb-4 flex gap-4">
                    <Input
                        placeholder="Search by Guest Name, Payment ID or Invoice ID"
                        prefix={<SearchOutlined />}
                        size="large"
                        style={{ maxWidth: 400 }}
                        onChange={e => setSearchText(e.target.value)}
                    />
                    <RangePicker size="large" />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
}