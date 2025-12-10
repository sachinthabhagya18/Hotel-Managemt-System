'use client';

import React, { useState, useEffect } from 'react';
import {
    Typography, Card, Form, Input, Button, TimePicker,
    InputNumber, Switch, Divider, Row, Col, message, Spin, App
} from 'antd';
import {
    SaveOutlined, BankOutlined, ClockCircleOutlined,
    GlobalOutlined, SettingOutlined, PhoneOutlined,
    MailOutlined, LinkOutlined, FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminSettingsPage() {
    const { message: messageApi } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hotelId, setHotelId] = useState(null);

    // --- FETCH SETTINGS ---
    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            try {
                const headers = { 'Authorization': `Token ${token}` };
                const res = await fetch(`${API_URL}/hotels/`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    const hotels = data.results || data || [];

                    if (hotels.length > 0) {
                        const hotel = hotels[0];
                        setHotelId(hotel.id);

                        form.setFieldsValue({
                            name: hotel.name,
                            location: hotel.location,
                            logo_url: hotel.logo_url,
                            // Policies
                            check_in_time: hotel.check_in_time ? dayjs(hotel.check_in_time, 'HH:mm:ss') : null,
                            check_out_time: hotel.check_out_time ? dayjs(hotel.check_out_time, 'HH:mm:ss') : null,
                            maintenance_mode: hotel.maintenance_mode || false,
                            // Financials
                            default_currency: hotel.default_currency || 'LKR',
                            tax_rate: hotel.tax_rate || 0,
                            // New Fields (Ensure backend supports these or they will be ignored)
                            contact_phone: hotel.contact_phone || '',
                            contact_email: hotel.contact_email || '',
                            facebook_url: hotel.facebook_url || '',
                            instagram_url: hotel.instagram_url || '',
                            cancellation_policy: hotel.cancellation_policy || '',
                        });
                    }
                }
            } catch (error) {
                messageApi.error("Failed to load settings.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [form]);

    // --- UPDATE HANDLER (FIXED ERROR HANDLING) ---
    const handleSave = async (values) => {
        setSubmitting(true);
        const token = localStorage.getItem('authToken');

        try {
            const payload = {
                ...values,
                check_in_time: values.check_in_time ? values.check_in_time.format('HH:mm:ss') : null,
                check_out_time: values.check_out_time ? values.check_out_time.format('HH:mm:ss') : null,
            };

            const url = hotelId ? `${API_URL}/hotels/${hotelId}/` : `${API_URL}/hotels/`;
            const method = hotelId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                // --- IMPROVED ERROR PARSING ---
                const errorData = await res.json().catch(() => null);
                let errorMsg = `Update failed (${res.status})`;

                if (errorData && typeof errorData === 'object') {
                    // Convert Django error object { field: ["error"] } to string
                    const details = Object.entries(errorData)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                        .join(' | ');
                    if (details) errorMsg = details;
                } else {
                    // Fallback for HTML errors (500s)
                    const text = await res.text().catch(() => "");
                    console.error("Server Error:", text);
                    if (res.status === 500) errorMsg = "Server Error (500). Check backend logs for migration issues.";
                }
                throw new Error(errorMsg);
            }

            messageApi.success("System settings updated successfully!");

        } catch (error) {
            console.error(error);
            messageApi.error(error.message); // Display the REAL error from backend
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><Spin size="large" /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>System Configuration</Title>
                    <Text type="secondary">Manage global hotel settings and public information.</Text>
                </div>
                <Button
                    type="primary"
                    onClick={() => form.submit()}
                    icon={<SaveOutlined />}
                    size="large"
                    loading={submitting}
                    className="bg-indigo-600 h-10 px-6 font-bold"
                >
                    Save Changes
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Row gutter={[24, 24]}>

                    {/* --- GENERAL INFO --- */}
                    <Col xs={24} lg={14}>
                        <Card title={<span><SettingOutlined /> General Information</span>} className="shadow-sm rounded-xl h-full">
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="name" label="Hotel Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="location" label="Address / Location">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="logo_url" label="Logo URL">
                                        <Input placeholder="https://example.com/logo.png" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="cancellation_policy" label="Cancellation Policy / Footer Text">
                                        <TextArea rows={3} placeholder="e.g. Free cancellation up to 24 hours before check-in." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* --- CONTACT & SOCIAL --- */}
                    <Col xs={24} lg={10}>
                        <Card title={<span><PhoneOutlined /> Contact & Social</span>} className="shadow-sm rounded-xl h-full">
                            <Form.Item name="contact_phone" label="Public Phone">
                                <Input prefix={<PhoneOutlined className="text-slate-400" />} />
                            </Form.Item>
                            <Form.Item name="contact_email" label="Public Email">
                                <Input prefix={<MailOutlined className="text-slate-400" />} />
                            </Form.Item>
                            <Divider />
                            <Form.Item name="facebook_url" label="Facebook URL">
                                <Input prefix={<GlobalOutlined className="text-blue-600" />} placeholder="https://facebook.com/..." />
                            </Form.Item>
                            <Form.Item name="instagram_url" label="Instagram URL">
                                <Input prefix={<GlobalOutlined className="text-pink-600" />} placeholder="https://instagram.com/..." />
                            </Form.Item>
                        </Card>
                    </Col>

                    {/* --- FINANCIAL SETTINGS --- */}
                    <Col xs={24} md={12}>
                        <Card title={<span><BankOutlined /> Financial & Tax</span>} className="shadow-sm rounded-xl h-full">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="default_currency" label="Base Currency">
                                        <Input prefix={<GlobalOutlined />} placeholder="LKR" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="tax_rate" label="Global Tax Rate (%)">
                                        <InputNumber min={0} max={100} formatter={value => `${value}%`} parser={value => value.replace('%', '')} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* --- POLICIES --- */}
                    <Col xs={24} md={12}>
                        <Card title={<span><ClockCircleOutlined /> Hotel Policies</span>} className="shadow-sm rounded-xl h-full">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="check_in_time" label="Check-In Time">
                                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="check_out_time" label="Check-Out Time">
                                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Divider />
                            <div className="flex justify-between items-center">
                                <span>
                                    <span className="font-bold block">Maintenance Mode</span>
                                    <span className="text-xs text-slate-400">Disable new bookings publically</span>
                                </span>
                                <Form.Item name="maintenance_mode" valuePropName="checked" noStyle>
                                    <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                </Form.Item>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}