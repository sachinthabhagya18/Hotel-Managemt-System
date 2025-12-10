'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Typography,
    Tag,
    Space,
    Modal, // Keep for the <Modal> component itself
    Form,
    Input,
    Select,
    Row,
    Col,
    InputNumber,
    Popconfirm,
    Image,
    Upload,
    App // Import App for context hooks
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    InboxOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';

import { usePathname, useRouter } from 'next/navigation';

const getStatusColor = (status) => {
    switch (status) {
        case 'CLEAN': return 'green';
        case 'DIRTY': return 'orange';
        case 'MAINTENANCE': return 'red';
        default: return 'default';
    }
};

export default function AdminRoomsPage() {
    // --- FIX 1: Use App Hooks ---
    const { message, modal } = App.useApp();

    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);

    const [form] = Form.useForm();
    const [typeForm] = Form.useForm();

    const [rooms, setRooms] = useState([]);
    const [allRoomTypes, setAllRoomTypes] = useState([]);
    const [allAmenities, setAllAmenities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState(null);
    const [fileList, setFileList] = useState([]);

    // --- HELPER: Unified Error Handler ---
    const handleApiError = async (res, title = "Operation Failed") => {
        const text = await res.text();
        let errorContent;
        try {
            const json = JSON.parse(text);
            if (Object.keys(json).length === 0) {
                errorContent = <Text type="danger">Server returned an empty error. Check backend logs.</Text>;
            } else {
                errorContent = (
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#ff4d4f' }}>
                        {Object.entries(json).map(([key, val]) => (
                            <li key={key}>
                                <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong> {Array.isArray(val) ? val.join(', ') : String(val)}
                            </li>
                        ))}
                    </ul>
                );
            }
        } catch (e) {
            errorContent = (
                <div style={{ color: 'red', background: '#fff1f0', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                    <strong>Server returned HTML (Crash):</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '5px' }}>
                        {text.substring(0, 500)}...
                    </pre>
                </div>
            );
        }

        // Use modal hook instead of static Modal
        modal.error({
            title: `${title} (${res.status})`,
            content: (
                <div>
                    <p>The server could not complete your request:</p>
                    {errorContent}
                </div>
            ),
            width: 600,
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        // if (!token) {
        //     message.error("Access Denied: Please log in to view the Admin Panel.");
        //     router.push('/admin/login');
        //     return;
        // }

        setIsAuthorized(true);

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchRooms(), fetchRoomTypes(), fetchAmenities()]);
            setLoading(false);
        };

        fetchData();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch(`${API_URL}/rooms/`);
            const data = await res.json();
            const rawRooms = data.results || data || [];

            const formattedData = rawRooms.map((room) => ({
                ...room,
                roomType: room.room_type_name,
                roomNumber: room.room_number,
                imageUrl: room.room_type_image || `https://placehold.co/100x60/e2e8f0/64748b?text=Room+${room.room_number}`,
            }));
            setRooms(formattedData);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const fetchRoomTypes = async () => {
        try {
            const res = await fetch(`${API_URL}/room-types/`);
            const data = await res.json();
            setAllRoomTypes(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch room types:', error);
        }
    };

    const fetchAmenities = async () => {
        try {
            const res = await fetch(`${API_URL}/amenities/`);
            const data = await res.json();
            setAllAmenities(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch amenities:', error);
        }
    };

    const showAddModal = () => {
        form.resetFields();
        setEditingRecord(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        form.setFieldsValue({
            room_number: record.roomNumber,
            room_type: record.room_type,
            floor: record.floor,
            status: record.status,
        });
        setEditingRecord(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/rooms/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!res.ok) {
                await handleApiError(res, "Failed to Delete Room");
                return;
            }

            message.success('Room deleted successfully!');
            fetchRooms();
        } catch (error) {
            console.error(error);
            message.error('Network error while deleting room.');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingRecord(null);
    };

    const handleFormSubmit = async (values) => {
        const token = localStorage.getItem('authToken');
        const roomData = {
            room_number: values.room_number,
            room_type: values.room_type,
            floor: values.floor,
            status: values.status,
        };

        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord ? `${API_URL}/rooms/${editingRecord.id}/` : `${API_URL}/rooms/`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(roomData),
            });

            if (!res.ok) {
                await handleApiError(res, "Failed to Save Room");
                return;
            }

            message.success(editingRecord ? 'Room updated successfully!' : 'New room added successfully!');
            setIsModalVisible(false);
            form.resetFields();
            setEditingRecord(null);
            fetchRooms();
        } catch (error) {
            console.error(error);
            modal.error({ title: 'Network Error', content: 'Could not connect to server.' });
        }
    };

    // --- ROOM TYPE HANDLERS ---
    const showTypeModal = () => {
        typeForm.resetFields();
        setFileList([]);
        setIsTypeModalVisible(true);
    };

    const handleTypeCancel = () => {
        setIsTypeModalVisible(false);
        typeForm.resetFields();
        setFileList([]);
    };

    const handleTypeSubmit = async (values) => {
        const token = localStorage.getItem('authToken');

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('price_weekday', values.price_weekday);
        formData.append('price_weekend', values.price_weekend);
        formData.append('capacity', values.capacity);

        if (values.amenities) {
            values.amenities.forEach(id => formData.append('amenities', id));
        }

        // --- FIX 2: Robust Image Extraction ---
        if (fileList && fileList.length > 0) {
            // AntD might wrap the file in originFileObj, or it might be the file itself
            const fileToUpload = fileList[0].originFileObj || fileList[0];
            if (fileToUpload instanceof Blob) {
                formData.append('image', fileToUpload);
            }
        }

        try {
            const res = await fetch(`${API_URL}/room-types/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` },
                body: formData,
            });

            if (!res.ok) {
                await handleApiError(res, "Failed to Create Room Type");
                return;
            }

            message.success('New Room Type created successfully!');
            setIsTypeModalVisible(false);
            typeForm.resetFields();
            setFileList([]);
            fetchRoomTypes();
        } catch (error) {
            console.error(error);
            modal.error({
                title: 'Network Error',
                content: 'Could not connect to the backend. Is the server running?'
            });
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            setFileList([file]); // Store raw file
            return false; // Prevent auto upload
        },
        fileList,
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            render: (url) => (
                <Image width={80} height={50} src={url} alt="Room" style={{ objectFit: 'cover', borderRadius: 4 }} fallback="https://placehold.co/100x60?text=No+Img" />
            ),
        },
        {
            title: 'Room #',
            dataIndex: 'roomNumber',
            key: 'roomNumber',
            sorter: (a, b) => a.roomNumber.localeCompare(b.roomNumber),
        },
        {
            title: 'Type',
            dataIndex: 'roomType',
            key: 'roomType',
            filters: allRoomTypes.map(rt => ({ text: rt.name, value: rt.name })),
            onFilter: (value, record) => record.roomType.includes(value),
        },
        {
            title: 'Floor',
            dataIndex: 'floor',
            key: 'floor',
            sorter: (a, b) => a.floor - b.floor,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm title="Delete room?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (!isAuthorized) return null;

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>Manage Rooms</Title>
                    <Text type="secondary">Oversee room status and types.</Text>
                </Col>
                <Col>
                    <Space>
                        <Button icon={<InboxOutlined />} onClick={showTypeModal}>Create Room Type</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Add Room</Button>
                    </Space>
                </Col>
            </Row>

            <Table columns={columns} dataSource={rooms} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

            {/* Add Room Modal */}
            <Modal title={editingRecord ? 'Edit Room' : 'Add New Room'} open={isModalVisible} onCancel={handleModalCancel} onOk={() => form.submit()} okText="Save" destroyOnHidden>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={{ status: 'CLEAN', floor: 1 }}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="room_number" label="Room Number" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="floor" label="Floor" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="room_type" label="Room Type" rules={[{ required: true }]}>
                        <Select placeholder="Select type">
                            {allRoomTypes.map((rt) => <Option key={rt.id} value={rt.id}>{rt.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select>
                            <Option value="CLEAN">Clean</Option>
                            <Option value="DIRTY">Dirty</Option>
                            <Option value="MAINTENANCE">Maintenance</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create Room Type Modal */}
            <Modal title="Create New Room Category" open={isTypeModalVisible} onCancel={handleTypeCancel} onOk={() => typeForm.submit()} okText="Create Category" width={700} destroyOnHidden>
                <Form form={typeForm} layout="vertical" onFinish={handleTypeSubmit}>
                    <Row gutter={16}>
                        <Col span={24}><Form.Item name="name" label="Category Name" rules={[{ required: true }]}><Input placeholder="e.g., Ocean View Suite" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="price_weekday" label="Weekday Price" rules={[{ required: true }]}><InputNumber prefix="LKR" style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="price_weekend" label="Weekend Price" rules={[{ required: true }]}><InputNumber prefix="LKR" style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="amenities" label="Amenities">
                        <Select mode="multiple" placeholder="Select amenities">
                            {allAmenities.map(am => <Option key={am.id} value={am.id}>{am.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Room Image">
                        <Upload {...uploadProps} listType="picture">
                            <Button icon={<UploadOutlined />}>Select Image</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}