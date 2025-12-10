'use client';

import React, { useState, useEffect } from 'react';
import {
    Card, Row, Col, Typography, Form, Input, Button,
    Avatar, Tabs, Tag, Spin, Divider, Upload, App
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined,
    SafetyCertificateOutlined, LockOutlined, SaveOutlined,
    BankOutlined, UploadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminProfilePage() {
    // Use App hook for context-aware messages
    const { message } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [user, setUser] = useState(null);
    const [staffProfile, setStaffProfile] = useState(null);

    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('user');

            if (!token || !storedUser) return;

            try {
                const parsedUser = JSON.parse(storedUser);
                const headers = { 'Authorization': `Token ${token}` };

                // 1. Fetch User Details
                const userRes = await fetch(`${API_URL}/users/${parsedUser.id}/`, { headers });
                const userData = await userRes.json();

                // 2. Fetch Staff Profile 
                const staffRes = await fetch(`${API_URL}/staff/`, { headers });
                const staffList = await staffRes.json();

                // Find the profile linked to this user ID
                const myProfile = (staffList.results || staffList).find(p => p.user.id === parsedUser.id);

                setUser(userData);
                setStaffProfile(myProfile);

                // 3. Pre-fill Form
                form.setFieldsValue({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: userData.email,
                    phone: myProfile?.phone || '',
                    job_title: myProfile?.job_title || '',
                    department: myProfile?.department || '',
                });

            } catch (error) {
                console.error("Profile load error:", error);
                message.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [form]);

    // --- 2. UPDATE PROFILE HANDLER ---
    const handleProfileUpdate = async (values) => {
        setSubmitting(true);
        const token = localStorage.getItem('authToken');

        try {
            // 1. Update User Model (Name, Email)
            const userPayload = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email
            };

            const userUpdateRes = await fetch(`${API_URL}/users/${user.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(userPayload)
            });

            if (!userUpdateRes.ok) throw new Error("Failed to update basic info");

            // 2. Update Staff Profile (Phone)
            if (staffProfile) {
                const staffPayload = {
                    phone: values.phone,
                };

                const staffUpdateRes = await fetch(`${API_URL}/staff/${staffProfile.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify(staffPayload)
                });

                if (!staffUpdateRes.ok) throw new Error("Failed to update staff details");
            }

            message.success("Profile updated successfully!");

            // Update local storage
            const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
            lsUser.firstName = values.first_name;
            lsUser.lastName = values.last_name;
            localStorage.setItem('user', JSON.stringify(lsUser));

        } catch (error) {
            console.error(error);
            message.error("Update failed. Please check your inputs.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- 3. PASSWORD CHANGE HANDLER ---
    const handlePasswordChange = async (values) => {
        setPasswordLoading(true);
        const token = localStorage.getItem('authToken');

        try {
            const res = await fetch(`${API_URL}/change-password/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    old_password: values.currentPassword,
                    new_password: values.newPassword
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                // Handle specific errors from backend (e.g., "Wrong password")
                if (errData.old_password) {
                    throw new Error(errData.old_password[0]);
                } else if (errData.new_password) {
                    throw new Error(errData.new_password[0]);
                } else {
                    throw new Error("Failed to change password");
                }
            }

            message.success("Password changed successfully!");
            passwordForm.resetFields();

        } catch (error) {
            console.error(error);
            message.error(error.message || "Password update failed.");
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Spin size="large" tip="Loading Profile..." /></div>;
    }

    return (
        <div>
            <Title level={2} className="mb-6">My Profile</Title>

            <Row gutter={[24, 24]}>
                {/* --- LEFT COLUMN: ID CARD --- */}
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm rounded-xl text-center" variant={false}>
                        <div className="flex flex-col items-center py-6">
                            <div className="relative mb-4">
                                <Avatar
                                    size={120}
                                    icon={<UserOutlined />}
                                    className="bg-indigo-600 text-white text-4xl"
                                />
                            </div>
                            <Title level={3} style={{ marginBottom: 0 }}>
                                {user?.first_name} {user?.last_name}
                            </Title>
                            <Text type="secondary">{user?.email}</Text>

                            <div className="mt-4 mb-6">
                                <Tag color="blue" className="px-3 py-1 text-sm">
                                    {staffProfile?.role || 'ADMIN'}
                                </Tag>
                            </div>

                            <Divider />

                            <div className="w-full text-left space-y-3">
                                <div className="flex justify-between">
                                    <Text type="secondary">Employee ID</Text>
                                    <Text strong>EMP-{user?.id}</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text type="secondary">Joined</Text>
                                    <Text strong>{new Date(user?.date_joined).toLocaleDateString()}</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text type="secondary">Status</Text>
                                    <Tag color="success">Active</Tag>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* --- RIGHT COLUMN: FORMS --- */}
                <Col xs={24} lg={16}>
                    <Card
                        className="shadow-sm rounded-xl"
                        variant={false}
                        tabList={[
                            { key: 'details', tab: 'Personal Details' },
                        ]}
                        activeTabKey="details"
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleProfileUpdate}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                                        <Input prefix={<MailOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="phone" label="Phone Number">
                                        <Input prefix={<PhoneOutlined className="text-slate-400" />} size="large" placeholder="+1 234 567 890" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="job_title" label="Job Title">
                                        <Input prefix={<SafetyCertificateOutlined className="text-slate-400" />} size="large" disabled className="bg-slate-50 text-slate-500" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="department" label="Department">
                                        <Input prefix={<BankOutlined className="text-slate-400" />} size="large" disabled className="bg-slate-50 text-slate-500" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="flex justify-end mt-4">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    size="large"
                                    loading={submitting}
                                    className="bg-indigo-600"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </Form>
                    </Card>

                    <Card className="shadow-sm rounded-xl mt-6" variant={false} title="Change Password">
                        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                        name="currentPassword"
                                        label="Current Password"
                                        rules={[{ required: true, message: 'Please enter your current password' }]}
                                    >
                                        <Input.Password prefix={<LockOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 8, message: 'Must be at least 8 characters' }]}>
                                        <Input.Password prefix={<LockOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        dependencies={['newPassword']}
                                        rules={[
                                            { required: true, message: 'Please confirm your password' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <div className="flex justify-end">
                                <Button type="default" htmlType="submit" size="large" loading={passwordLoading}>Update Password</Button>
                            </div>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}