'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Typography,
    Tag,
    Select,
    Space,
    Avatar,
    Button,
    Modal,
    Form,
    message,
    App,
    Popconfirm,
    Input
} from 'antd';
import {
    UserOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// --- API & AUTH ---
const API_URL = 'http://127.0.0.1:8000/api';
// --- PASTE YOUR TOKEN FROM 'python manage.py drf_create_token your_username' ---
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5';

// Helper for status colors
const getStatusColor = (status) => {
    switch (status) {
        case 'CLEAN': return 'green';
        case 'DIRTY': return 'orange';
        case 'MAINTENANCE': return 'red';
        case 'IN_PROGRESS': return 'blue';
        default: return 'default';
    }
};

export default function HousekeepingPage() {
    const { message } = App.useApp();

    // --- State ---
    const [tasks, setTasks] = useState([]);
    const [staffList, setStaffList] = useState([]); // For dropdown
    const [roomList, setRoomList] = useState([]);   // For dropdown (creating tasks)
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- Fetch Data ---
    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Tasks, Staff, and Rooms in parallel
            const [tasksRes, staffRes, roomsRes] = await Promise.all([
                fetch(`${API_URL}/housekeeping/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } }),
                fetch(`${API_URL}/staff/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } }),
                fetch(`${API_URL}/rooms/`, { headers: { 'Authorization': `Token ${AUTH_TOKEN}` } })
            ]);

            if (!tasksRes.ok || !staffRes.ok || !roomsRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const tasksData = await tasksRes.json();
            const staffData = await staffRes.json();
            const roomsData = await roomsRes.json();

            // 2. Process Staff List (extract User ID for assignment)
            // The API returns StaffProfiles, but HousekeepingTask links to User ID.
            const processedStaff = (staffData.results || []).map(s => ({
                userId: s.user.id, // This is what we send to the backend
                name: `${s.user.first_name} ${s.user.last_name}`,
                role: s.job_title
            }));
            setStaffList(processedStaff);

            // 3. Process Rooms
            setRoomList(roomsData.results || []);

            // 4. Process Tasks
            setTasks(tasksData.results || []);

        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load housekeeping data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (AUTH_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
            message.error('Please paste your AUTH_TOKEN in housekeeping/page.js');
            setLoading(false);
            return;
        }
        fetchData();
    }, []);


    // --- Handlers ---

    // Quick Update: Change Status directly in table
    const handleStatusChange = async (newStatus, record) => {
        try {
            const res = await fetch(`${API_URL}/housekeeping/${record.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed');

            message.success('Status updated');
            fetchData(); // Refresh to show change
        } catch (error) {
            message.error('Update failed');
        }
    };

    // Quick Update: Assign Staff directly in table
    const handleAssignmentChange = async (userId, record) => {
        try {
            const res = await fetch(`${API_URL}/housekeeping/${record.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ assigned_to: userId })
            });

            if (!res.ok) throw new Error('Failed');

            message.success('Assignment updated');
            fetchData();
        } catch (error) {
            message.error('Assignment failed');
        }
    };

    // Delete Task
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/housekeeping/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${AUTH_TOKEN}` }
            });
            if (!res.ok) throw new Error('Failed');
            message.success('Task deleted');
            fetchData();
        } catch (error) {
            message.error('Delete failed');
        }
    };

    // Create New Task
    const handleFormSubmit = async (values) => {
        try {
            const res = await fetch(`${API_URL}/housekeeping/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify({
                    room: values.room, // Room ID
                    assigned_to: values.assigned_to, // User ID
                    status: values.status,
                    notes: values.notes
                })
            });

            if (!res.ok) {
                const err = await res.text();
                console.error(err);
                throw new Error('Failed');
            }

            message.success('Task created successfully');
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Failed to create task');
        }
    };

    // --- Columns ---
    const columns = [
        {
            title: 'Room',
            dataIndex: 'room_number', // Read-only field from serializer
            key: 'room_number',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => handleStatusChange(value, record)}
                    style={{ width: 140 }}
                >
                    <Option value="CLEAN">
                        <Tag color="green">CLEAN</Tag>
                    </Option>
                    <Option value="DIRTY">
                        <Tag color="orange">DIRTY</Tag>
                    </Option>
                    <Option value="IN_PROGRESS">
                        <Tag color="blue">IN PROGRESS</Tag>
                    </Option>
                    <Option value="MAINTENANCE">
                        <Tag color="red">MAINTENANCE</Tag>
                    </Option>
                </Select>
            ),
        },
        {
            title: 'Assigned To',
            dataIndex: 'assigned_to', // This is the ID from API
            key: 'assigned_to',
            render: (staffId, record) => (
                <Select
                    value={staffId} // The API returns the ID here
                    onChange={(value) => handleAssignmentChange(value, record)}
                    style={{ width: 200 }}
                    placeholder="Unassigned"
                    allowClear
                >
                    {staffList.map((staff) => (
                        <Option key={staff.userId} value={staff.userId}>
                            <Space>
                                <Avatar icon={<UserOutlined />} size="small" />
                                {staff.name}
                            </Space>
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm title="Delete task?" onConfirm={() => handleDelete(record.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    return (
        <div>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Housekeeping</Title>
                        <Text type="secondary">Manage room cleaning status and staff assignments.</Text>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Create Task
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={tasks}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Space>

            {/* Create Task Modal */}
            <Modal
                title="New Housekeeping Task"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Create"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={{ status: 'DIRTY' }}>
                    <Form.Item name="room" label="Select Room" rules={[{ required: true }]}>
                        <Select placeholder="Choose a room">
                            {roomList.map(room => (
                                <Option key={room.id} value={room.id}>Room {room.room_number}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="assigned_to" label="Assign Staff (Optional)">
                        <Select placeholder="Select staff member" allowClear>
                            {staffList.map(staff => (
                                <Option key={staff.userId} value={staff.userId}>{staff.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select>
                            <Option value="DIRTY">Dirty</Option>
                            <Option value="IN_PROGRESS">In Progress</Option>
                            <Option value="CLEAN">Clean</Option>
                            <Option value="MAINTENANCE">Maintenance</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}