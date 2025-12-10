'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select,
    Tag, Space, Typography, Row, Col, App, InputNumber, Popconfirm, Divider
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    UserAddOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';

export default function EmployeesPage() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    // --- FETCH EMPLOYEES ---
    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/staff/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.results || data || []);
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to load employees.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // --- HANDLERS ---
    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            first_name: record.user.first_name,
            last_name: record.user.last_name,
            email: record.user.email,
            phone: record.phone,
            role: record.role,
            job_title: record.job_title,
            department: record.department,
            salary: record.salary,
            pay_frequency: record.pay_frequency,
            status: record.status
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/staff/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                message.success('Employee removed.');
                fetchEmployees();
            } else {
                message.error('Failed to remove employee.');
            }
        } catch (error) {
            message.error('Network error.');
        }
    };

    const handleSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_URL}/staff/${editingId}/` : `${API_URL}/staff/`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(values)
            });

            if (!res.ok) {
                const err = await res.json();
                const errorMsg = Object.values(err).flat().join(', ');
                throw new Error(errorMsg || 'Operation failed');
            }

            message.success(editingId ? 'Profile updated!' : 'Employee created successfully!');
            setIsModalVisible(false);
            fetchEmployees();
        } catch (error) {
            console.error(error);
            message.error(error.message);
        }
    };

    // --- COLUMNS ---
    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_, record) => (
                <div>
                    <Text strong>{record.user.first_name} {record.user.last_name}</Text>
                    <div className="text-xs text-slate-400">{record.user.email}</div>
                </div>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'blue';
                if (role === 'ADMIN') color = 'purple';
                if (role === 'HOUSEKEEPER') color = 'orange';
                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            title: 'Job Title',
            dataIndex: 'job_title',
            key: 'job_title',
            render: (text) => text || '-'
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text) => text || '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'success' : 'error'}>{status}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm title="Delete employee?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Employee Management</Title>
                    <Text type="secondary">Manage staff access, roles, and payroll details.</Text>
                </div>
                <Button type="primary" icon={<UserAddOutlined />} size="large" onClick={handleAdd}>
                    Add Employee
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={employees}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
                className="shadow-sm rounded-xl border border-slate-200"
            />

            <Modal
                title={editingId ? "Edit Staff Profile" : "Add New Employee"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                width={700}
                okText="Save Profile"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Divider orientation="left">User Account</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                                <Input placeholder="Jane" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                                <Input placeholder="Doe" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email (Username)" rules={[{ required: true, type: 'email' }]}>
                                <Input placeholder="jane@hotel.com" disabled={!!editingId} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="password"
                                label={editingId ? "New Password (Optional)" : "Password"}
                                rules={[{ required: !editingId, message: 'Password is required for new accounts' }]}
                            >
                                <Input.Password placeholder="••••••••" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Role & Position</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="role" label="System Role" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="STAFF">Staff (General)</Option>
                                    <Option value="ADMIN">Hotel Admin (Manager)</Option>
                                    <Option value="HOUSEKEEPER">Housekeeper</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="job_title" label="Job Title">
                                <Input placeholder="e.g. Receptionist" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="department" label="Department">
                                <Input placeholder="e.g. Front Desk" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="phone" label="Phone Number">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Status" initialValue="Active">
                                <Select>
                                    <Option value="Active">Active</Option>
                                    <Option value="Inactive">Inactive</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Payroll Details</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="salary" label="Base Salary" initialValue={0}>
                                <InputNumber
                                    prefix="$"
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="pay_frequency" label="Pay Frequency" initialValue="Monthly">
                                <Select>
                                    <Option value="Monthly">Monthly</Option>
                                    <Option value="Bi-Weekly">Bi-Weekly</Option>
                                    <Option value="Weekly">Weekly</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}