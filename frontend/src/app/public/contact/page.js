'use client';

import React, { useState } from 'react';
import { Typography, Card, Form, Input, Button, Row, Col, message, Result ,Select} from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

export default function ContactPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/contact-messages/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            if (res.ok) {
                setSubmitted(true);
                form.resetFields();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            messageApi.error("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-lg w-full shadow-xl rounded-2xl text-center py-12">
                    <Result
                        status="success"
                        title="Message Sent Successfully!"
                        subTitle="Thank you for contacting Azure Coast. Our concierge team has received your inquiry and will contact you shortly."
                        extra={[
                            <Button type="primary" key="home" size="large" className="bg-indigo-600" onClick={() => window.location.href = '/public'}>
                                Back to Home
                            </Button>,
                            <Button key="again" onClick={() => setSubmitted(false)}>
                                Send Another Message
                            </Button>,
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {contextHolder}

            {/* Hero */}
            <div className="bg-slate-900 text-white py-24 text-center px-4">
                <Title level={1} style={{ color: 'white', marginBottom: 16 }}>Contact Us</Title>
                <Text className="text-slate-300 text-lg">We are here to assist you with any questions or special requests.</Text>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <Row gutter={[32, 32]}>
                    {/* Contact Info Card */}
                    <Col xs={24} lg={8}>
                        <Card className="h-full shadow-lg rounded-xl bg-indigo-600 text-white border-0">
                            <Title level={3} style={{ color: 'white' }}>Get in Touch</Title>
                            <div className="space-y-8 mt-8">
                                <div className="flex items-start gap-4">
                                    <PhoneOutlined className="text-2xl opacity-80" />
                                    <div>
                                        <div className="font-bold opacity-80 uppercase text-xs tracking-wider">Phone</div>
                                        <div className="text-lg">+94 76 551 8976</div>
                                        <div className="text-sm opacity-70">Mon-Fri 9am-6pm</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <MailOutlined className="text-2xl opacity-80" />
                                    <div>
                                        <div className="font-bold opacity-80 uppercase text-xs tracking-wider">Email</div>
                                        <div className="text-lg">info@staysync.com</div>
                                        <div className="text-sm opacity-70">24/7 Online Support</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <EnvironmentOutlined className="text-2xl opacity-80" />
                                    <div>
                                        <div className="font-bold opacity-80 uppercase text-xs tracking-wider">Location</div>
                                        <div className="text-lg">123 Ocean Drive</div>
                                        <div className="text-sm opacity-70">Staysync, Colombo 7</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Form Card */}
                    <Col xs={24} lg={16}>
                        <Card className="h-full shadow-lg rounded-xl border-slate-100 p-6">
                            <Title level={3} className="mb-6">Send a Message</Title>
                            <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="name" label="Your Name" rules={[{ required: true }]}>
                                            <Input placeholder="User" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                                            <Input placeholder="user@example.com" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                                    <Select placeholder="Select a topic">
                                        <Select.Option value="Booking Inquiry">Booking Inquiry</Select.Option>
                                        <Select.Option value="Event Planning">Wedding / Event Planning</Select.Option>
                                        <Select.Option value="Feedback">Feedback / Review</Select.Option>
                                        <Select.Option value="Other">Other</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="message" label="Message" rules={[{ required: true }]}>
                                    <Input.TextArea rows={5} placeholder="How can we help you?" />
                                </Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    icon={<SendOutlined />}
                                    className="bg-indigo-600 h-12 font-bold"
                                >
                                    Send Message
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}