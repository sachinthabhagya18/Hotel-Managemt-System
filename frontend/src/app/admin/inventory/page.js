'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Typography,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    Row,
    Col,
    InputNumber,
    App, // Use App for messages
    Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// --- API & AUTH ---
const API_URL = 'http://127.0.0.1:8000/api';
// --- PASTE YOUR TOKEN FROM 'python manage.py drf_create_token your_username' ---
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5';

const getStatus = (stock, threshold) => {
    if (stock <= 0) return { color: 'red', text: 'Out of Stock' };
    if (stock <= threshold) return { color: 'orange', text: 'Low Stock' };
    return { color: 'green', text: 'In Stock' };
};

export default function InventoryPage() {
    const { message } = App.useApp();

    // --- State ---
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const [form] = Form.useForm();

    // --- DATA FETCHING (GET) ---
    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/inventory/`, {
                headers: { 'Authorization': `Token ${AUTH_TOKEN}` }
            });

            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();

            // Handle paginated response (data.results)
            const formattedData = (data.results || []).map(item => ({
                ...item,
                key: item.id,
                // Backend uses snake_case, ensure we map correctly if needed
                stockLevel: item.stock_level,
                threshold: item.low_stock_threshold,
            }));

            setInventory(formattedData);
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load inventory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (AUTH_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
            message.error('Please paste your AUTH_TOKEN in inventory/page.js');
            setLoading(false);
            return;
        }
        fetchInventory();
    }, []);

    // --- HANDLERS ---

    const showAddModal = () => {
        form.resetFields();
        setEditingRecord(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        form.setFieldsValue({
            name: record.name,
            stock_level: record.stockLevel, // Field names must match API/Form
            low_stock_threshold: record.threshold,
        });
        setEditingRecord(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/inventory/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${AUTH_TOKEN}` }
            });

            if (!res.ok) throw new Error('Failed to delete');

            message.success('Item deleted successfully!');
            fetchInventory();
        } catch (error) {
            message.error('Failed to delete item.');
        }
    };

    const handleFormSubmit = async (values) => {
        // Match API fields
        const itemData = {
            name: values.name,
            stock_level: values.stock_level,
            low_stock_threshold: values.low_stock_threshold,
            // 'hotel' is handled by backend
        };

        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord
            ? `${API_URL}/inventory/${editingRecord.id}/`
            : `${API_URL}/inventory/`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify(itemData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API Error:", errorText);
                throw new Error('Failed to save item');
            }

            message.success(editingRecord ? 'Item updated!' : 'Item added!');
            setIsModalVisible(false);
            form.resetFields();
            setEditingRecord(null);
            fetchInventory();
        } catch (error) {
            message.error('Failed to save item. See console for details.');
        }
    };

    // --- COLUMNS ---
    const columns = [
        {
            title: 'Item Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Stock Level',
            dataIndex: 'stockLevel',
            key: 'stockLevel',
            sorter: (a, b) => a.stockLevel - b.stockLevel,
        },
        {
            title: 'Low Stock Threshold',
            dataIndex: 'threshold',
            key: 'threshold',
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const status = getStatus(record.stockLevel, record.threshold);
                return <Tag color={status.color}>{status.text}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this item?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button primary icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>Inventory Management</Title>
                    <Text type="secondary">Track amenities and supplies.</Text>
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} size="large">
                        Add Item
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={inventory}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingRecord ? 'Edit Item' : 'Add New Item'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Save"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Form.Item name="name" label="Item Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="stock_level" label="Stock Level" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="low_stock_threshold" label="Low Stock Threshold" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}