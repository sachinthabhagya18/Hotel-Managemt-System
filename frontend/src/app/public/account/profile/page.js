'use client';

import React, { useState, useEffect } from 'react';
import {
    Card, Row, Col, Typography, Form, Input, Button,
    Avatar, Tabs, Tag, message, Spin, Divider, Upload
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined,
    SafetyCertificateOutlined, LockOutlined, SaveOutlined,
    BankOutlined, UploadOutlined, HomeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const API_URL = 'http://127.0.0.1:8000/api';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [guestProfile, setGuestProfile] = useState(null);

    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('user');

            if (!token || !storedUser) return;

            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                const headers = { 'Authorization': `Token ${token}` };

                // Normalize email from different possible shapes in localStorage
                const email = parsedUser.email
                    || parsedUser.username
                    || (parsedUser.user && parsedUser.user.email)
                    || parsedUser.emailAddress
                    || parsedUser.email_address
                    || '';

                // B. Fetch Guest Profile (Linked by Email)
                // Customers are 'Guests', not 'Staff'. We search by email when available.
                let guestRes = { ok: false };
                if (email) {
                    guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, { headers });
                }

                let currentGuest = null;
                if (guestRes.ok) {
                    const guestData = await guestRes.json();
                    const results = guestData.results || guestData || [];
                    if (results.length > 0) {
                        currentGuest = results[0];
                        setGuestProfile(currentGuest);
                    }
                }

                // C. Pre-fill Form (use normalized email)
                form.setFieldsValue({
                    firstName: parsedUser.firstName || parsedUser.first_name || '', // From LocalStorage/User Model
                    lastName: parsedUser.lastName || parsedUser.last_name || '',   // From LocalStorage/User Model
                    email: email,
                    phone: currentGuest?.phone || '',      // From Guest Model
                    address: currentGuest?.address || '',  // From Guest Model
                });

            } catch (error) {
                console.error("Profile load error:", error);
                messageApi.error("Failed to load complete profile.");
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
            const updatedUser = { ...user, firstName: values.firstName, lastName: values.lastName };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            const guestPayload = {
                name: `${values.firstName} ${values.lastName}`,
                email: values.email,
                phone: values.phone,
                address: values.address
            };

            let res;
            if (guestProfile) {
                res = await fetch(`${API_URL}/guests/${guestProfile.id}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                    body: JSON.stringify(guestPayload)
                });
            } else {
                res = await fetch(`${API_URL}/guests/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                    body: JSON.stringify(guestPayload)
                });
            }

            if (!res.ok) throw new Error("Failed to save contact details");

            const savedGuest = await res.json();
            setGuestProfile(savedGuest);
            messageApi.success("Profile updated successfully!");

        } catch (error) {
            console.error(error);
            messageApi.error("Update failed. Please check your inputs.");
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

            messageApi.success("Password changed successfully!");
            passwordForm.resetFields();

        } catch (error) {
            console.error(error);
            messageApi.error(error.message || "Password update failed.");
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        // return <div className="flex h-96 items-center justify-center"><Spin size="large" tip="Loading Profile..." /></div>;
    }

    return (
        <div>
            {contextHolder}
            <Title level={2} className="mb-6">My Profile</Title>

            <Row gutter={[24, 24]}>
                {/* --- LEFT COLUMN: SUMMARY CARD --- */}
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
                                {user?.firstName} {user?.lastName}
                            </Title>
                            <Text type="secondary">{user?.email}</Text>

                            <div className="mt-4 mb-6">
                                <Tag color="blue" className="px-3 py-1 text-sm">
                                    GUEST
                                </Tag>
                            </div>

                            <Divider />

                            <div className="w-full text-left space-y-3">
                                <div className="flex justify-between">
                                    <Text type="secondary">Member Since</Text>
                                    <Text strong>Oct 2023</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text type="secondary">Account Status</Text>
                                    <Tag color="success">Active</Tag>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* --- RIGHT COLUMN: EDIT FORM --- */}
                <Col xs={24} lg={16}>
                    <Card
                        className="shadow-sm rounded-xl"
                        variant={false}
                        tabList={[
                            { key: 'details', tab: 'Personal Details' },
                            { key: 'security', tab: 'Security' }
                        ]}
                        activeTabKey="details" // Just showing details by default, tabs managed by scrolling typically or state
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleProfileUpdate}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined className="text-slate-400" />} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
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

                            <Form.Item name="address" label="Billing Address">
                                <Input.TextArea
                                    prefix={<HomeOutlined className="text-slate-400" />}
                                    rows={2}
                                    placeholder="Street address, City, Zip Code"
                                />
                            </Form.Item>

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