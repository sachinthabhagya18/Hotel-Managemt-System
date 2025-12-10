'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Typography,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    Row,
    Col,
    Popconfirm,
    Avatar,
    Select,
    // message, // <-- This is intentionally removed
    App, // <-- We use App to get the message context
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- API & AUTH ---
const API_URL = 'http://127.0.0.1:8000/api';
// --- PASTE YOUR TOKEN FROM 'python manage.py drf_create_token your_username' ---
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5'; // e.g., '9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b'


// --- Guests Page Component ---
export default function GuestsPage() {
    // This hook gets the 'message' function from the <App> wrapper in layout.js
    const { message } = App.useApp();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- State for Data ---
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState(null);

    // --- Data Fetching (CRUD) ---

    // (READ) Fetch all guests
    const fetchGuests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/guests/`, {
                headers: {
                    'Authorization': `Token ${AUTH_TOKEN}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch guests');
            const data = await res.json();

            // FIX: Use data.results to handle paginated API response
            setGuests(data.results || []);
        } catch (error) {
            console.error('Failed to fetch guests:', error);
            message.error('Failed to load guests.');
        } finally {
            setLoading(false);
        }
    };

    // Run fetches on page load
    useEffect(() => {
        if (AUTH_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
            message.error('Please paste your AUTH_TOKEN at the top of guests/page.js');
            setLoading(false);
            return;
        }
        fetchGuests();
    }, []);

    // --- Table Column Definitions ---
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    {name}
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Address', // This field comes from your serializer
            dataIndex: 'address',
            key: 'address',
            ellipsis: true, // Shorten long addresses
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this guest?"
                        description="Are you sure you want to delete this guest?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" icon={<DeleteOutlined />} danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // --- Modal & Form Handlers ---
    const showAddModal = () => {
        form.resetFields();
        setEditingRecord(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        form.setFieldsValue(record);
        setEditingRecord(record);
        setIsModalVisible(true);
    };

    // (DELETE) Handle the delete action
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/guests/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
            });
            if (!res.ok) {
                throw new Error('Failed to delete guest');
            }
            message.success('Guest deleted successfully!');
            fetchGuests(); // Refresh the table
        } catch (error) {
            console.error('Failed to delete guest:', error);
            message.error('Failed to delete guest.');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingRecord(null);
    };

    // (CREATE / UPDATE) Handle the save button
    const handleFormSubmit = async (values) => {
        // The form values (name, email, phone, address)
        // match the GuestSerializer perfectly.

        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord
            ? `${API_URL}/guests/${editingRecord.id}/`
            : `${API_URL}/guests/`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                // FIX: Read the response as text first
                const errorText = await res.text();
                try {
                    const errorData = JSON.parse(errorText);
                    console.error('Django Error (JSON):', errorData);
                    const errorMessages = Object.entries(errorData).map(([key, value]) => `${key}: ${value.join(' ')}`).join(' ');
                    message.error(`Failed to save: ${errorMessages}`);
                } catch (e) {
                    console.error('Django Error (HTML):', errorText);
                    message.error('Server error. Check console for details.');
                }
                return; // Stop execution
            }

            message.success(
                editingRecord
                    ? 'Guest updated successfully!'
                    : 'New guest added successfully!'
            );

            setIsModalVisible(false);
            form.resetFields();
            setEditingRecord(null);
            fetchGuests(); // Refresh the table
        } catch (error) {
            console.error('Failed to save guest:', error);
            message.error('Failed to save guest.');
        }
    };

    // --- Render ---

    return (
        <div>
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: '24px' }}
            >
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        Manage Guests
                    </Title>
                    <Text type="secondary" style={{ display: 'block' }}>
                        View, add, or edit guest information.
                    </Text>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showAddModal}
                        size="large"
                    >
                        Add New Guest
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={guests}
                rowKey="id"
                loading={loading} // Add loading state
                pagination={{ pageSize: 10 }}
            />

            {/* --- Add/Edit Modal --- */}
            <Modal
                title={editingRecord ? 'Edit Guest' : 'Add New Guest'}
                open={isModalVisible}
                onCancel={handleModalCancel}
                onOk={() => form.submit()}
                okText="Save"
                width={600}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[
                            { required: true, message: 'Please enter the guest name' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            {
                                required: true,
                                message: 'Please enter a valid email',
                                type: 'email',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[
                            { required: true, message: 'Please enter a phone number' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="address"
                        label="Address (Optional)"
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    {/* The 'status' field from the old mock data is not in the
            Guest model in your backend, so it has been removed from the form.
            You can add it back to hotel/models.py and hotel/serializers.py if needed.
          */}

                </Form>
            </Modal>
        </div>
    );
}