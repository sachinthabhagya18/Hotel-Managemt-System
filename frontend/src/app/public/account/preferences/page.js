'use client';

import React, { useState, useEffect } from 'react';
import {
    Typography, Card, Form, Switch, Select, Checkbox,
    Button, Row, Col, message, Divider, Tag, Spin, Alert
} from 'antd';
import {
    SaveOutlined, HeartOutlined, CoffeeOutlined,
    SoundOutlined, RestOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';

// --- MOCK ROUTER ---
const useRouterMock = () => {
    return {
        push: (path) => {
            if (typeof window !== 'undefined') window.location.href = path;
        }
    };
};

export default function PreferencesPage() {
    const router = useRouterMock();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [guestId, setGuestId] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();

    // --- LOAD PREFERENCES ---
    useEffect(() => {
        const fetchPreferences = async () => {
            const token = localStorage.getItem('authToken');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/public/account');
                return;
            }

            const user = JSON.parse(userStr);
            const email = user.email || user.username;

            try {
                const headers = { 'Authorization': `Token ${token}` };

                // 1. Find Guest Profile
                const res = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    const results = data.results || data || [];

                    if (results.length > 0) {
                        const guest = results[0];
                        setGuestId(guest.id);

                        // 2. Load Preferences into Form
                        // Backend returns JSON in 'preferences' field
                        const prefs = guest.preferences || {};
                        form.setFieldsValue({
                            highFloor: prefs.highFloor || false,
                            quietRoom: prefs.quietRoom || false,
                            extraPillows: prefs.extraPillows || false,
                            bedType: prefs.bedType || 'no_pref',
                            dietary: prefs.dietary || [],
                            newsletter: prefs.newsletter !== undefined ? prefs.newsletter : true,
                            smsUpdates: prefs.smsUpdates !== undefined ? prefs.smsUpdates : true
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading preferences:", error);
                messageApi.error("Could not load your preferences.");
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [form]);

    // --- SAVE HANDLER ---
    const handleSave = async (values) => {
        if (!guestId) {
            messageApi.error("Guest profile not found. Please update your profile details first.");
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            // We need to PATCH the guest object with the new preferences JSON
            const res = await fetch(`${API_URL}/guests/${guestId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    preferences: values // Save the whole form object as JSON
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            messageApi.success({
                content: 'Preferences updated! We will customize your next stay.',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            });
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to save preferences.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Spin size="large" tip="Loading..." /></div>;

    return (
        <div className="max-w-5xl mx-auto">
            {contextHolder}
            <div className="mb-8">
                <Title level={2} className="!mb-2">Stay Preferences</Title>
                <Text type="secondary" className="text-lg">
                    Tell us what makes you comfortable. We'll apply these settings to all your future bookings.
                </Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                    highFloor: false, quietRoom: false, extraPillows: false,
                    bedType: 'no_pref', dietary: [],
                    newsletter: true, smsUpdates: true
                }}
            >
                <Row gutter={[24, 24]}>
                    {/* --- ROOM COMFORT --- */}
                    <Col xs={24} lg={14}>
                        <Card
                            title={<span className="flex items-center gap-2 text-lg"><RestOutlined className="text-indigo-600" /> Room & Comfort</span>}
                            variant={false}
                            className="shadow-sm rounded-xl h-full"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-center hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div>
                                        <Text strong className="block text-base">High Floor</Text>
                                        <Text type="secondary" className="text-sm">Prefer rooms on higher levels for better views and privacy.</Text>
                                    </div>
                                    <Form.Item name="highFloor" valuePropName="checked" noStyle>
                                        <Switch />
                                    </Form.Item>
                                </div>

                                <Divider className="my-1" />

                                <div className="flex justify-between items-center hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div>
                                        <Text strong className="block text-base">Quiet Room</Text>
                                        <Text type="secondary" className="text-sm">Away from elevators, ice machines, and high-traffic areas.</Text>
                                    </div>
                                    <Form.Item name="quietRoom" valuePropName="checked" noStyle>
                                        <Switch />
                                    </Form.Item>
                                </div>

                                <Divider className="my-1" />

                                <div className="flex justify-between items-center hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div>
                                        <Text strong className="block text-base">Extra Pillows</Text>
                                        <Text type="secondary" className="text-sm">Ensure 2 additional hypoallergenic pillows are ready upon arrival.</Text>
                                    </div>
                                    <Form.Item name="extraPillows" valuePropName="checked" noStyle>
                                        <Switch />
                                    </Form.Item>
                                </div>

                                <Divider className="my-1" />

                                <div className="p-2">
                                    <Form.Item name="bedType" label={<span className="font-bold text-base">Preferred Bed Configuration</span>} className="mb-0">
                                        <Select size="large" className="w-full md:w-64">
                                            <Option value="king">King Bed</Option>
                                            <Option value="queen">Queen Bed</Option>
                                            <Option value="twin">Twin Beds</Option>
                                            <Option value="no_pref">No Preference</Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* --- DIETARY & EXTRAS --- */}
                    <Col xs={24} lg={10}>
                        <div className="flex flex-col gap-6 h-full">
                            <Card
                                title={<span className="flex items-center gap-2 text-lg"><CoffeeOutlined className="text-orange-500" /> Dining & Dietary</span>}
                                variant={false}
                                className="shadow-sm rounded-xl flex-1"
                            >
                                <Alert message="Used to customize your welcome amenities and room service." type="info" showIcon className="mb-4" />

                                <Form.Item name="dietary" label={<span className="font-bold">Dietary Restrictions / Allergies</span>}>
                                    <Checkbox.Group style={{ width: '100%' }}>
                                        <Row gutter={[8, 12]}>
                                            <Col span={12}><Checkbox value="gluten_free">Gluten Free</Checkbox></Col>
                                            <Col span={12}><Checkbox value="vegetarian">Vegetarian</Checkbox></Col>
                                            <Col span={12}><Checkbox value="vegan">Vegan</Checkbox></Col>
                                            <Col span={12}><Checkbox value="nut_free">Nut Free</Checkbox></Col>
                                            <Col span={12}><Checkbox value="dairy_free">Dairy Free</Checkbox></Col>
                                            <Col span={12}><Checkbox value="halal">Halal</Checkbox></Col>
                                        </Row>
                                    </Checkbox.Group>
                                </Form.Item>
                            </Card>

                            <Card
                                title={<span className="flex items-center gap-2 text-lg"><SoundOutlined className="text-blue-500" /> Communication</span>}
                                variant={false}
                                className="shadow-sm rounded-xl"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-medium">SMS Updates (Check-in/out)</span>
                                    <Form.Item name="smsUpdates" valuePropName="checked" noStyle>
                                        <Switch size="small" />
                                    </Form.Item>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Special Offers & News</span>
                                    <Form.Item name="newsletter" valuePropName="checked" noStyle>
                                        <Switch size="small" />
                                    </Form.Item>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>

                {/* --- ACTION BAR --- */}
                <div className="mt-8 flex justify-end pt-6 border-t border-slate-200">
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        size="large"
                        loading={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 px-10 h-12 font-bold shadow-lg shadow-indigo-200 rounded-xl"
                    >
                        Save Preferences
                    </Button>
                </div>
            </Form>
        </div>
    );
}