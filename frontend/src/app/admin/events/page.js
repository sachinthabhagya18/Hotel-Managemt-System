'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Button, Modal, Form, Select, Input, message, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/event-bookings/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.results || data || []);
      }
    } catch (error) {
      message.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const token = localStorage.getItem('authToken');
    try {
        await fetch(`${API_URL}/event-bookings/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        message.success('Status updated');
        fetchEvents();
    } catch (e) {
        message.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/event-bookings/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
    });
    message.success("Event deleted");
    fetchEvents();
  };

  const columns = [
    {
        title: 'Guest',
        dataIndex: 'guest_name',
        key: 'guest_name',
        render: (text, record) => (
            <div>
                <div className="font-bold">{text}</div>
                <div className="text-xs text-slate-400">{record.guest_email}</div>
            </div>
        )
    },
    {
        title: 'Type',
        dataIndex: 'event_type',
        key: 'event_type',
        render: (type) => <Tag color="purple">{type}</Tag>
    },
    {
        title: 'Dates',
        key: 'dates',
        render: (_, r) => <span className="text-xs">{r.start_date} to {r.end_date}</span>
    },
    {
        title: 'Attendees',
        dataIndex: 'attendees',
        key: 'attendees'
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
            let color = 'blue';
            if(status === 'CONFIRMED') color = 'green';
            if(status === 'CANCELLED') color = 'red';
            return <Tag color={color}>{status}</Tag>;
        }
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
            <Space>
                {record.status === 'PENDING' && (
                    <>
                        <Button size="small" type="text" icon={<CheckCircleOutlined className="text-green-500" />} onClick={() => handleStatusUpdate(record.id, 'CONFIRMED')}>Approve</Button>
                        <Button size="small" type="text" icon={<CloseCircleOutlined className="text-red-500" />} onClick={() => handleStatusUpdate(record.id, 'CANCELLED')}>Reject</Button>
                    </>
                )}
                <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )
    }
  ];

  return (
    <div>
        <Title level={2} className="mb-6">Wedding & Event Bookings</Title>
        <Table 
            dataSource={events} 
            columns={columns} 
            rowKey="id" 
            loading={loading} 
            className="shadow-sm rounded-xl border border-slate-200"
        />
    </div>
  );
}