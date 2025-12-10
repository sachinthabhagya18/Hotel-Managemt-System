'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Layout, Alert, Modal, App } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

const useRouter = () => {
    return {
        push: (path) => {
            if (typeof window !== 'undefined') {
                window.location.href = path;
            }
        }
    };
};

export default function AdminLoginPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Clear session on load to prevent conflicts
    useEffect(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }, []);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password
                })
            });

            const data = await res.json();

            // --- DEBUG: Inspect what the server actually sent ---
            console.log("LOGIN RESPONSE:", data);

            if (res.ok) {
                if (!data.user) {
                    message.error("Server Error: Token received but User Data is missing.");
                    setLoading(false);
                    return;
                }

                const user = data.user;

                // --- FIX: ROBUST ROLE DETECTION ---
                // Force role to SUPER_ADMIN if any admin flag is true
                let role = user.role;
                if (user.is_superuser || user.is_staff) {
                    role = 'SUPER_ADMIN';
                }
                // Default to GUEST if undefined
                if (!role) role = 'GUEST';

                // Check privileges
                const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role);

                if (!isAdmin) {
                    Modal.error({
                        title: "Access Denied",
                        content: (
                            <div>
                                <p>This account is detected as a <b>Guest</b>.</p>
                                <p><b>Debug Info:</b></p>
                                <ul className="text-xs text-slate-500 list-disc pl-4">
                                    <li>Username: {user.username}</li>
                                    <li>is_superuser: {String(user.is_superuser)}</li>
                                    <li>is_staff: {String(user.is_staff)}</li>
                                    <li>Role (Received): {user.role || 'null'}</li>
                                    <li>Role (Calculated): {role}</li>
                                </ul>
                                <p className="mt-2">Ensure you created this user via <code>python manage.py createsuperuser</code>.</p>
                            </div>
                        )
                    });
                    setLoading(false);
                    return;
                }

                // Save Valid Session
                localStorage.setItem('authToken', data.token || data.access);

                // Create standardized user object for the app
                const userData = {
                    ...user,
                    role: role, // Use our calculated role
                    is_superuser: user.is_superuser || role === 'SUPER_ADMIN' // Ensure this flag is set
                };

                localStorage.setItem('user', JSON.stringify(userData));

                message.success("Login successful. Accessing Dashboard...");

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 500);
            } else {
                message.error(data.detail || "Invalid credentials.");
            }
        } catch (error) {
            console.error("Login Error:", error);
            message.error("Connection failed. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                className="absolute top-6 left-6 text-white/70 hover:text-white hover:bg-white/10 z-20 font-medium"
                onClick={() => router.push('/public')}
            >
                Back to Website
            </Button>

            <Card
                className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl rounded-2xl"
                variant={false}
                stylesbody={{ padding: '40px' }}
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <SafetyCertificateOutlined style={{ fontSize: 32, color: 'white' }} />
                    </div>
                    <Title level={2} style={{ marginBottom: 8, fontWeight: 800, color: '#1e293b' }}>Admin Portal</Title>
                    <Text type="secondary" className="text-base">Secure access for management</Text>
                </div>

                <Alert
                    message="For Staff Use Only"
                    description="Customer accounts cannot be used to log in here."
                    type="warning"
                    showIcon
                    className="mb-6 text-xs"
                />

                <Form
                    name="admin_login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter your username' }]}
                    >
                        <Input prefix={<UserOutlined className="text-slate-400 mr-2" />} placeholder="Admin Username" className="rounded-lg py-3" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined className="text-slate-400 mr-2" />} placeholder="Password" className="rounded-lg py-3" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 border-none h-12 font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all mt-2"
                        >
                            Sign In to Dashboard
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}