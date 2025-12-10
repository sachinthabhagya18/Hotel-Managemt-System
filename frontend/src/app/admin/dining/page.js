'use client';

import React, { useState, useEffect } from 'react';
import {
    Tabs, Table, Card, Button, Tag, Typography, Modal,
    Form, Input, InputNumber, Select, Upload, Space, App, Row, Col
} from 'antd';
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminDiningPage() {
    // 1. Use the App hook for messages (Must be inside AdminLayout which has <App>)
    const { message } = App.useApp();

    const [items, setItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Token ${token}` };

            const [itemsRes, ordersRes] = await Promise.all([
                fetch(`${API_URL}/food-items/`, { headers }),
                fetch(`${API_URL}/food-orders/`, { headers })
            ]);

            if (itemsRes.ok) setItems((await itemsRes.json()).results || []);
            if (ordersRes.ok) setOrders((await ordersRes.json()).results || []);
        } catch (error) {
            message.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // --- MENU MANAGEMENT HANDLERS ---
    const handleSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('category', values.category);
        formData.append('price', values.price);
        formData.append('description', values.description || '');
        formData.append('is_available', 'true');

        // --- FIX: Robust File Extraction ---
        if (fileList && fileList.length > 0) {
            // Ant Design can wrap files. We check for 'originFileObj' first.
            // If it's not there, we assume the item itself is the File (from beforeUpload).
            const fileToUpload = fileList[0].originFileObj || fileList[0];

            // Double check it's a valid Blob/File before appending
            if (fileToUpload instanceof Blob) {
                formData.append('image', fileToUpload);
            }
        }

        const url = editingItem
            ? `${API_URL}/food-items/${editingItem.id}/`
            : `${API_URL}/food-items/`;

        const method = editingItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Token ${token}` }, // No Content-Type for FormData
                body: formData
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("Backend Error:", errText);
                throw new Error(`Server rejected request: ${res.status}`);
            }

            message.success("Menu item saved!");
            setIsModalVisible(false);
            setFileList([]);
            fetchData();
        } catch (error) {
            console.error(error);
            // This message call was previously failing if context wasn't right
            message.error("Error saving item. Check console.");
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/food-items/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!res.ok) throw new Error("Delete failed");

            message.success("Item deleted");
            fetchData();
        } catch (error) {
            message.error("Failed to delete item");
        }
    };

    const updateOrderStatus = async (id, status) => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_URL}/food-orders/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error("Update failed");

            message.success(`Order marked as ${status}`);
            fetchData();
        } catch (error) {
            message.error("Failed to update order status");
        }
    };

    // --- COLUMNS ---
    const itemColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Category', dataIndex: 'category', key: 'category', render: text => <Tag>{text.toUpperCase()}</Tag> },
        { title: 'Price', dataIndex: 'price', key: 'price', render: p => `LKR ${p}` },
        {
            title: 'Actions',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingItem(record);
                        form.setFieldsValue(record);
                        setFileList([]); // Reset images on edit
                        setIsModalVisible(true);
                    }} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }
    ];

    const orderColumns = [
        { title: 'Room', dataIndex: 'room_number', key: 'room_number', render: t => <span className="font-bold">{t}</span> },
        { title: 'Guest', dataIndex: 'guest_name', key: 'guest' },
        {
            title: 'Items',
            dataIndex: 'items_json',
            key: 'items',
            render: (items) => (
                <ul className="list-disc pl-4 text-xs">
                    {Array.isArray(items) ? items.map((i, idx) => (
                        <li key={idx}>{i.qty}x {i.name}</li>
                    )) : 'Invalid Data'}
                </ul>
            )
        },
        { title: 'Total', dataIndex: 'total_price', key: 'total', render: p => `LKR ${p}` },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 120 }}
                    onChange={(val) => updateOrderStatus(record.id, val)}
                >
                    <Option value="PENDING">Pending</Option>
                    <Option value="PREPARING">Preparing</Option>
                    <Option value="DELIVERED">Delivered</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                </Select>
            )
        }
    ];

    // --- FIX: Proper Upload Props ---
    // We manually handle fileList state to ensure we have the raw file object
    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            setFileList([file]); // Store the raw file immediately
            return false; // Prevent automatic upload by AntD
        },
        fileList,
    };

    // Tabs items configuration
    const tabItems = [
        {
            key: 'orders',
            label: 'Live Orders',
            children: <Table dataSource={orders} columns={orderColumns} rowKey="id" loading={loading} />
        },
        {
            key: 'menu',
            label: 'Menu Items',
            children: <Table dataSource={items} columns={itemColumns} rowKey="id" loading={loading} />
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{ margin: 0 }}>Dining Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingItem(null);
                    form.resetFields();
                    setFileList([]);
                    setIsModalVisible(true);
                }}>Add Menu Item</Button>
            </div>

            <Card className="shadow-sm rounded-xl">
                <Tabs defaultActiveKey="orders" items={tabItems} />
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={editingItem ? "Edit Item" : "New Food Item"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="starters">Starters</Option>
                                    <Option value="mains">Mains</Option>
                                    <Option value="drinks">Beverages</Option>
                                    <Option value="dessert">Dessert</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                                <InputNumber prefix="LKR " style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Image">
                        <Upload {...uploadProps} listType="picture" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select Image</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}