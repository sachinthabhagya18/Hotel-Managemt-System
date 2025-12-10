'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Select, Card, message, Space, Button, Popconfirm } from 'antd';
import { DeleteOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/contact-messages/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.results || data || []);
            }
        } catch (error) {
            message.error('Failed to load messages.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`${API_URL}/contact-messages/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            message.success('Status updated');
            fetchMessages();
        } catch (e) {
            message.error('Update failed');
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`${API_URL}/contact-messages/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            message.success('Message deleted');
            fetchMessages();
        } catch (e) {
            message.error('Delete failed');
        }
    };

    const columns = [
        {
            title: 'Sender',
            key: 'sender',
            render: (_, r) => (
                <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.email}</div>
                </div>
            )
        },
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            width: '40%',
            render: (text) => <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>{text}</Paragraph>
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (d) => new Date(d).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 130 }}
                    onChange={(val) => updateStatus(record.id, val)}
                    status={status === 'PENDING' ? 'warning' : ''}
                >
                    <Option value="PENDING">Pending</Option>
                    <Option value="CONTACTED">Contacted</Option>
                    <Option value="RESOLVED">Resolved</Option>
                </Select>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button href={`mailto:${record.email}`} type="text" icon={<MailOutlined />} title="Reply via Email" />
                    <Popconfirm title="Delete message?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Title level={2} className="mb-6">Guest Inquiries</Title>
            <Card className="shadow-sm rounded-xl border-slate-200">
                <Table
                    dataSource={messages}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>
        </div>
    );
}