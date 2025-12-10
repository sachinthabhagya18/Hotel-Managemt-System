'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Upload, Switch,
    message, Card, Typography, Tag, Space, Popconfirm, Image, Tabs, InputNumber, DatePicker, Select, App, Row, Col
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    UploadOutlined, FileTextOutlined, PercentageOutlined, NotificationOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const API_URL = 'http://127.0.0.1:8000/api';

export default function MarketingPage() {
    const { message: messageApi } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('banners');

    // --- STATES ---
    const [blogs, setBlogs] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [banners, setBanners] = useState([]);

    // --- MODAL STATES ---
    const [blogModalVisible, setBlogModalVisible] = useState(false);
    const [couponModalVisible, setCouponModalVisible] = useState(false);
    const [bannerModalVisible, setBannerModalVisible] = useState(false);

    const [editingItem, setEditingItem] = useState(null);

    const [blogForm] = Form.useForm();
    const [couponForm] = Form.useForm();
    const [bannerForm] = Form.useForm();

    const [fileList, setFileList] = useState([]);

    // =========================
    //      BANNER LOGIC
    // =========================
    const fetchBanners = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/promo-banners/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBanners(data.results || data || []);
            }
        } catch (error) {
            messageApi.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    const handleBannerSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const url = editingItem ? `${API_URL}/promo-banners/${editingItem.id}/` : `${API_URL}/promo-banners/`;
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                body: JSON.stringify(values)
            });
            if (!res.ok) throw new Error("Failed");
            messageApi.success("Banner saved successfully");
            setBannerModalVisible(false);
            bannerForm.resetFields();
            fetchBanners();
        } catch (error) {
            messageApi.error("Error saving banner");
        }
    };

    const handleBannerDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/promo-banners/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error("Failed");
            messageApi.success("Banner deleted");
            fetchBanners();
        } catch (e) {
            messageApi.error("Delete failed");
        }
    };

    // =========================
    //      BLOG LOGIC
    // =========================
    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/blogs/`);
            if (res.ok) {
                const data = await res.json();
                setBlogs(data.results || data || []);
            }
        } catch (error) { messageApi.error('Failed to load blogs'); }
        finally { setLoading(false); }
    };

    const handleBlogSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('content', values.content);
        formData.append('author', values.author || 'Admin');
        formData.append('is_published', values.is_published ? 'True' : 'False');

        if (fileList.length > 0) {
            const file = fileList[0].originFileObj || fileList[0];
            formData.append('image', file);
        }

        const url = editingItem ? `${API_URL}/blogs/${editingItem.id}/` : `${API_URL}/blogs/`;
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error("Failed");
            messageApi.success("Blog saved");
            setBlogModalVisible(false);
            blogForm.resetFields();
            setFileList([]);
            fetchBlogs();
        } catch (error) { messageApi.error("Error saving blog"); }
    };

    const handleBlogDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        await fetch(`${API_URL}/blogs/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Token ${token}` } });
        messageApi.success("Blog deleted");
        fetchBlogs();
    };

    // =========================
    //      COUPON LOGIC
    // =========================
    const fetchCoupons = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/coupons/`, { headers: { 'Authorization': `Token ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.results || data || []);
            }
        } catch (e) { messageApi.error('Failed to load coupons'); }
        finally { setLoading(false); }
    };

    const handleCouponSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const payload = {
            ...values,
            valid_from: values.valid_from ? values.valid_from.format('YYYY-MM-DD') : null,
            valid_to: values.valid_to ? values.valid_to.format('YYYY-MM-DD') : null
        };
        const url = editingItem ? `${API_URL}/coupons/${editingItem.id}/` : `${API_URL}/coupons/`;
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed");
            messageApi.success("Coupon saved");
            setCouponModalVisible(false);
            couponForm.resetFields();
            fetchCoupons();
        } catch (e) { messageApi.error("Error saving coupon"); }
    };

    const handleCouponDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        await fetch(`${API_URL}/coupons/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Token ${token}` } });
        messageApi.success("Coupon deleted");
        fetchCoupons();
    };

    // --- INITIAL LOAD (Moved after function definitions) ---
    useEffect(() => {
        if (activeTab === 'blogs') fetchBlogs();
        if (activeTab === 'coupons') fetchCoupons();
        if (activeTab === 'banners') fetchBanners();
    }, [activeTab]);

    // --- COLUMNS ---
    const bannerColumns = [
        { title: 'Internal Name', dataIndex: 'title', key: 'title', render: t => <Text strong>{t}</Text> },
        { title: 'Public Message', dataIndex: 'message', key: 'message' },
        {
            title: 'Style',
            dataIndex: 'style',
            key: 'style',
            render: s => {
                let color = 'blue';
                if (s === 'success') color = 'green';
                if (s === 'warning') color = 'orange';
                if (s === 'error') color = 'red';
                return <Tag color={color}>{s.toUpperCase()}</Tag>;
            }
        },
        { title: 'Active', dataIndex: 'is_active', key: 'active', render: a => <Tag color={a ? 'success' : 'default'}>{a ? 'LIVE' : 'HIDDEN'}</Tag> },
        {
            title: 'Actions', key: 'actions', render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => { setEditingItem(record); bannerForm.setFieldsValue(record); setBannerModalVisible(true); }} />
                    <Popconfirm title="Delete?" onConfirm={() => handleBannerDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
                </Space>
            )
        }
    ];

    const blogColumns = [
        { title: 'Cover', dataIndex: 'image', key: 'image', render: (url) => <Image width={60} src={url} fallback="https://placehold.co/100x60?text=No+Img" /> },
        { title: 'Title', dataIndex: 'title', key: 'title', render: (text) => <Text strong>{text}</Text> },
        { title: 'Status', dataIndex: 'is_published', key: 'status', render: (pub) => <Tag color={pub ? 'green' : 'orange'}>{pub ? 'Published' : 'Draft'}</Tag> },
        { title: 'Date', dataIndex: 'created_at_formatted', key: 'date' },
        { title: 'Actions', key: 'actions', render: (_, r) => (<Space><Button icon={<EditOutlined />} onClick={() => { setEditingItem(r); setFileList([]); blogForm.setFieldsValue(r); setBlogModalVisible(true); }} /><Popconfirm title="Delete?" onConfirm={() => handleBlogDelete(r.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space>) }
    ];

    const couponColumns = [
        { title: 'Code', dataIndex: 'code', key: 'code', render: t => <Tag color="blue">{t}</Tag> },
        { title: 'Discount', dataIndex: 'discount_percent', key: 'discount', render: v => <Text type="success">{v}% OFF</Text> },
        { title: 'Status', dataIndex: 'is_active', key: 'status', render: a => <Tag color={a ? 'success' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
        { title: 'Actions', key: 'actions', render: (_, r) => (<Space><Button icon={<EditOutlined />} onClick={() => { setEditingItem(r); couponForm.setFieldsValue({ ...r, valid_from: r.valid_from ? dayjs(r.valid_from) : null, valid_to: r.valid_to ? dayjs(r.valid_to) : null }); setCouponModalVisible(true); }} /><Popconfirm title="Delete?" onConfirm={() => handleCouponDelete(r.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space>) }
    ];

    // =========================
    //        RENDER
    // =========================
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Marketing Center</Title>
                    <Text type="secondary">Manage site banners, blogs, and promotions.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => {
                        setEditingItem(null);
                        if (activeTab === 'banners') { bannerForm.resetFields(); setBannerModalVisible(true); }
                        if (activeTab === 'blogs') { blogForm.resetFields(); setFileList([]); setBlogModalVisible(true); }
                        if (activeTab === 'coupons') { couponForm.resetFields(); setCouponModalVisible(true); }
                    }}
                >
                    Add New {activeTab === 'banners' ? 'Banner' : activeTab === 'blogs' ? 'Post' : 'Coupon'}
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm rounded-xl">
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'banners',
                        label: <span><NotificationOutlined /> Site Banners</span>,
                        children: <Table dataSource={banners} columns={bannerColumns} rowKey="id" loading={loading} />
                    },
                    {
                        key: 'blogs',
                        label: <span><FileTextOutlined /> Blogs</span>,
                        children: <Table dataSource={blogs} columns={blogColumns} rowKey="id" loading={loading} />
                    },
                    {
                        key: 'coupons',
                        label: <span><PercentageOutlined /> Coupons</span>,
                        children: <Table dataSource={coupons} columns={couponColumns} rowKey="id" loading={loading} />
                    }
                ]} />
            </Card>

            {/* --- BANNER MODAL --- */}
            <Modal
                title={editingItem ? "Edit Banner" : "Create Offer Banner"}
                open={bannerModalVisible}
                onCancel={() => setBannerModalVisible(false)}
                onOk={() => bannerForm.submit()}
            >
                <Form form={bannerForm} layout="vertical" onFinish={handleBannerSubmit} initialValues={{ is_active: true, style: 'info' }}>
                    <Form.Item name="title" label="Internal Name" rules={[{ required: true }]} help="For admin reference only (e.g. Summer Sale)">
                        <Input placeholder="e.g. Summer Sale 2025" />
                    </Form.Item>
                    <Form.Item name="message" label="Public Message" rules={[{ required: true }]} help="This will be shown at the top of the website">
                        <Input.TextArea rows={2} placeholder="e.g. Get 20% off all rooms this summer! Use code SUMMER20" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="style" label="Color Style">
                                <Select>
                                    <Option value="info">Blue (Info)</Option>
                                    <Option value="success">Green (Success/Sale)</Option>
                                    <Option value="warning">Orange (Alert)</Option>
                                    <Option value="error">Red (Urgent)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Live" unCheckedChildren="Hidden" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="link_text" label="Link Text"><Input placeholder="Book Now" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="link_url" label="Link URL"><Input placeholder="/public/rooms" /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>

            {/* --- BLOG MODAL --- */}
            <Modal
                title={editingItem ? "Edit Blog Post" : "Create New Blog Post"}
                open={blogModalVisible}
                onCancel={() => setBlogModalVisible(false)}
                onOk={() => blogForm.submit()}
                width={700}
            >
                <Form form={blogForm} layout="vertical" onFinish={handleBlogSubmit} initialValues={{ is_published: true, author: 'Admin' }}>
                    <Form.Item name="title" label="Post Title" rules={[{ required: true }]}>
                        <Input placeholder="Enter title..." />
                    </Form.Item>
                    <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                        <Input.TextArea rows={6} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="author" label="Author"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_published" label="Status" valuePropName="checked"><Switch checkedChildren="Published" unCheckedChildren="Draft" /></Form.Item></Col>
                    </Row>
                    <Form.Item label="Cover Image">
                        <Upload
                            listType="picture"
                            maxCount={1}
                            beforeUpload={(file) => { setFileList([file]); return false; }}
                            onRemove={() => setFileList([])}
                            fileList={fileList}
                        >
                            <Button icon={<UploadOutlined />}>Select Image</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* --- COUPON MODAL --- */}
            <Modal
                title={editingItem ? "Edit Coupon" : "Create New Coupon"}
                open={couponModalVisible}
                onCancel={() => setCouponModalVisible(false)}
                onOk={() => couponForm.submit()}
            >
                <Form form={couponForm} layout="vertical" onFinish={handleCouponSubmit} initialValues={{ is_active: true }}>
                    <Form.Item name="code" label="Coupon Code" rules={[{ required: true }]}>
                        <Input placeholder="e.g. SUMMER20" style={{ textTransform: 'uppercase' }} />
                    </Form.Item>
                    <Form.Item name="discount_percent" label="Discount (%)" rules={[{ required: true }]}>
                        <InputNumber min={1} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="valid_from" label="Valid From"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="valid_to" label="Valid To"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="is_active" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}