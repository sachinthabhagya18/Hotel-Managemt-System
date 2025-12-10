'use client';

import React, { useState } from 'react';
import { Typography, Card, Form, Input, DatePicker, Button, Select, InputNumber, Steps, Result, App } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';

// Use a mock router that performs a hard redirect to ensure state reset on navigation
const useRouterMock = () => ({ push: (p) => window.location.href = p });

export default function PlanEventPage() {
    const router = useRouterMock();

    // Use App hook for context-aware messages
    const { message } = App.useApp();

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        try {
            if (!token || !userStr) throw new Error("Please log in.");
            const user = JSON.parse(userStr);
            const email = user.email || user.username;

            // 1. Get Guest ID
            const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const guests = await guestRes.json();
            const guestId = guests.results?.[0]?.id;

            if (!guestId) throw new Error("Guest profile not found. Please update your profile.");

            // 2. Create Event
            const payload = {
                guest: guestId,
                event_type: values.type,
                start_date: values.dates[0].format('YYYY-MM-DD'),
                end_date: values.dates[1].format('YYYY-MM-DD'),
                attendees: values.attendees,
                budget_notes: values.budget,
                special_requests: values.notes,
                status: 'PENDING'
            };

            const res = await fetch(`${API_URL}/event-bookings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to submit request.");

            // --- SUCCESS MESSAGE & STATE UPDATE ---
            message.success("Booking is successful, we will get back to you shortly");
            setSuccess(true);

        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Result
                    status="success"
                    title="Request Submitted!"
                    subTitle="Booking is successful, we will get back to you shortly to finalize the details."
                    extra={[
                        <Button type="primary" key="console" onClick={() => router.push('/public/account/events')}>
                            View My Events
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
                <Title level={2}>Plan Your Event</Title>
                <Paragraph type="secondary">Whether it's a dream wedding or a corporate retreat, we make it happen.</Paragraph>
            </div>

            <Card className="shadow-md rounded-2xl border-0 p-6">
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Form.Item name="type" label="Event Type" rules={[{ required: true }]}>
                            <Select size="large" placeholder="Select Type">
                                <Option value="WEDDING">Wedding</Option>
                                <Option value="CONFERENCE">Conference</Option>
                                <Option value="PARTY">Private Party</Option>
                                <Option value="OTHER">Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="attendees" label="Estimated Guests" rules={[{ required: true }]}>
                            <InputNumber size="large" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item name="dates" label="Preferred Dates" rules={[{ required: true }]}>
                        <RangePicker size="large" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="budget" label="Budget Estimate (Optional)">
                        <Input size="large" placeholder="e.g. LKR 5000 - LKR 10000" />
                    </Form.Item>

                    <Form.Item name="notes" label="Special Requests / Theme Ideas">
                        <Input.TextArea rows={4} placeholder="Tell us about your vision..." />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={loading}
                        className="bg-indigo-600 h-12 font-bold mt-4"
                    >
                        Submit Proposal Request
                    </Button>
                </Form>
            </Card>
        </div>
    );
}