'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Upload, Switch,
    message, Card, Typography, Tag, Space, Popconfirm, Image, Row, Col
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    UploadOutlined, FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

export default function MarketingPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/blogs/`); // Public read access allowed
            if (res.ok) {
                const data = await res.json();
                setBlogs(data.results || data || []);
            }
        } catch (error) {
            message.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        if (!token) return message.error("Unauthorized");

        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('content', values.content);
        formData.append('author', values.author || 'Admin');
        formData.append('is_published', values.is_published ? 'True' : 'False');

        if (fileList.length > 0) {
            const file = fileList[0].originFileObj || fileList[0];
            formData.append('image', file);
        }

        const url = editingId ? `${API_URL}/blogs/${editingId}/` : `${API_URL}/blogs/`;
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("Failed to save blog");

            message.success(`Blog ${editingId ? 'updated' : 'published'} successfully`);
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            fetchBlogs();
        } catch (error) {
            message.error("Error saving blog");
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('authToken');
        await fetch(`${API_URL}/blogs/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${token}` }
        });
        message.success("Blog deleted");
        fetchBlogs();
    };

    const openModal = (record = null) => {
        setEditingId(record?.id || null);
        setFileList([]);
        if (record) {
            form.setFieldsValue({
                title: record.title,
                content: record.content,
                author: record.author,
                is_published: record.is_published
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ is_published: true, author: 'Admin' });
        }
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Cover',
            dataIndex: 'image',
            key: 'image',
            render: (url) => <Image width={60} src={url} fallback="https://placehold.co/100x60?text=No+Img" />
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'is_published',
            key: 'status',
            render: (pub) => <Tag color={pub ? 'green' : 'orange'}>{pub ? 'Published' : 'Draft'}</Tag>
        },
        {
            title: 'Date',
            dataIndex: 'created_at_formatted',
            key: 'date'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
                    <Popconfirm title="Delete blog?" onConfirm={() => handleDelete(record.id)}>
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const uploadProps = {
        onRemove: () => setFileList([]),
        beforeUpload: (file) => {
            setFileList([file]);
            return false;
        },
        fileList,
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ margin: 0 }}>Marketing & Blogs</Title>
                    <Text type="secondary">Manage news and updates for the customer website.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => openModal()}>
                    New Blog Post
                </Button>
            </div>

            <Card variant={false} className="shadow-sm rounded-xl">
                <Table
                    dataSource={blogs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title={editingId ? "Edit Blog Post" : "Create New Blog Post"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
                okText={editingId ? "Update" : "Publish"}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="title" label="Post Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Summer Events at Azure Coast" size="large" />
                    </Form.Item>

                    <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                        <Input.TextArea rows={8} placeholder="Write your article here..." />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="author" label="Author">
                                <Input placeholder="Admin" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_published" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Published" unCheckedChildren="Draft" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Cover Image">
                        <Upload {...uploadProps} listType="picture" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select Cover Image</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}