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
    Select,
    DatePicker,
    Row,
    Col,
    App,
    Popconfirm,
    InputNumber,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- API & AUTH ---
const API_URL = 'http://127.0.0.1:8000/api';

// --- IMPORTANT ---
// Paste the token you generated from your Django server here
// (e.g., from 'python manage.py drf_create_token your_username')
// Later, this will be saved in localStorage after a login.
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5'; // <-- PASTE YOUR TOKEN

// Helper object for API headers
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Token ${AUTH_TOKEN}`
});


// Helper function for status tag colors
const getStatusColor = (status) => {
    switch (status) {
        case 'CONFIRMED':
            return 'green';
        case 'PENDING':
            return 'blue';
        case 'CANCELLED':
            return 'red';
        case 'CHECKED_IN':
            return 'purple';
        case 'CHECKED_OUT':
            return 'default';
        default:
            return 'default';
    }
};

// --- Bookings Page Component ---
export default function BookingsPage() {
    const { message } = App.useApp();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [bookings, setBookings] = useState([]);
    const [allGuests, setAllGuests] = useState([]);
    const [allRoomTypes, setAllRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState(null);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10; // Fixed page size for controlled pagination

    // --- DATA FETCHING (CRUD) ---

    // (READ) Fetch bookings (now paginated)
    // Fetches the specified page from the backend API
    const fetchBookings = async (page = currentPage) => {
        try {
            setLoading(true);
            // Use query params to tell DRF which page and size we want
            const res = await fetch(`${API_URL}/bookings/?page=${page}&page_size=${pageSize}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const errorText = await res.text();
                try {
                    const errorData = JSON.parse(errorText);
                    console.error('Django Error (Fetch):', errorData);
                    const firstErrorKey = Object.keys(errorData)[0];
                    const firstErrorMessage = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];

                    if (res.status === 401 || res.status === 403) {
                        message.error(`Authentication Failed (${res.status}). Check your AUTH_TOKEN and CORS setup.`);
                    } else {
                        message.error(`Failed to load: ${firstErrorKey} - ${firstErrorMessage}`);
                    }
                } catch (jsonError) {
                    console.error(`Server Error (${res.status}):`, errorText.substring(0, 200));
                    message.error(`Server error (${res.status}). Check console for CORS/Network/Auth details.`);
                }
                return;
            }

            const data = await res.json();

            const formattedData = (data.results || []).map((b) => ({
                ...b,
                key: b.id,
                guestName: b.guest_name,
                roomType: b.room_type_name,
                checkInDate: b.check_in,
                checkOutDate: b.check_out,
                totalPrice: b.total_price,
            }));

            // Update state with fetched data and total count
            setBookings(formattedData);
            setCurrentPage(page);
            setTotalItems(data.count || 0); // DRF pagination provides the total count

        } catch (error) {
            console.error('Network or Parse Error during fetch:', error);
            message.error('A network error occurred. Is the Django server running and accessible?');
        } finally {
            setLoading(false);
        }
    };

    // (READ) Fetch Guests and RoomTypes for the modal dropdowns
    const fetchDependencies = async () => {
        try {
            const [guestRes, roomTypeRes] = await Promise.all([
                fetch(`${API_URL}/guests/`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/room-types/`, { headers: getAuthHeaders() }),
            ]);

            if (!guestRes.ok || !roomTypeRes.ok) {
                console.error('Failed to fetch dependencies:', guestRes.status, roomTypeRes.status);
                message.warning('Could not load guest or room type lists for the form.');
                return;
            }

            const guestData = await guestRes.json();
            const roomTypeData = await roomTypeRes.json();

            setAllGuests(guestData.results || []);
            setAllRoomTypes(roomTypeData.results || []);
        } catch (error) {
            console.error('Failed to fetch dependencies:', error);
            message.error('Failed to load guests or room types.');
        }
    };

    // Run initial fetches on page load
    useEffect(() => {
        if (AUTH_TOKEN === 'YOUR_TOKEN_HERE' || AUTH_TOKEN === '') {
            message.error('Please add your API token to AUTH_TOKEN constant.');
            setLoading(false);
            return;
        }
        fetchBookings(1); // Start on page 1
        fetchDependencies();
    }, []);


    // Handler for Antd Table pagination changes (user clicks next/prev)
    const handleTableChange = (pagination) => {
        // Only fetch if the page number actually changed
        if (pagination.current !== currentPage) {
            fetchBookings(pagination.current);
        }
        // Note: We ignore pagination.pageSize change since we keep it fixed (pageSize=10)
    };

    // --- Table Column Definitions ---
    const columns = [
        {
            title: 'Guest Name',
            dataIndex: 'guestName',
            key: 'guestName',
            sorter: (a, b) => a.guestName.localeCompare(b.guestName),
        },
        {
            title: 'Room Type',
            dataIndex: 'roomType',
            key: 'roomType',
        },
        {
            title: 'Check-in',
            dataIndex: 'checkInDate',
            key: 'checkInDate',
            sorter: (a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime(),
        },
        {
            title: 'Check-out',
            dataIndex: 'checkOutDate',
            key: 'checkOutDate',
            sorter: (a, b) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)} key={status}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Total Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price) => `LKR ${Number(price).toFixed(2)}`,
            sorter: (a, b) => a.totalPrice - b.totalPrice,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this booking?"
                        description="Are you sure you want to delete this booking?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" icon={<DeleteOutlined />} danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // --- Modal & Form Handlers (Omitted for brevity, unchanged) ---

    const showAddModal = () => {
        form.resetFields();
        setEditingRecord(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        form.setFieldsValue({
            guest: record.guest,
            room_type: record.room_type,
            status: record.status,
            total_price: record.totalPrice, // Use API field name
            special_requests: record.special_requests,
            dates: [dayjs(record.checkInDate), dayjs(record.checkOutDate)],
        });
        setEditingRecord(record);
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingRecord(null);
    };

    // (CREATE / UPDATE) Handle the save button (Logic simplified for readability, only pagination change is critical)
    const handleFormSubmit = async (values) => {
        const bookingData = {
            hotel: 1,
            guest: values.guest,
            room_type: values.room_type,
            check_in: values.dates[0].format('YYYY-MM-DD'),
            check_out: values.dates[1].format('YYYY-MM-DD'),
            status: values.status,
            total_price: values.total_price,
            special_requests: values.special_requests,
        };

        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord
            ? `${API_URL}/bookings/${editingRecord.id}/`
            : `${API_URL}/bookings/`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(bookingData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                try {
                    const errorData = JSON.parse(errorText);
                    console.error('Django Error:', errorData);
                    const firstErrorKey = Object.keys(errorData)[0];
                    const firstErrorMessage = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];
                    message.error(`Failed: ${firstErrorKey} - ${firstErrorMessage}`);
                } catch (jsonError) {
                    console.error('Server Error (HTML):', errorText);
                    message.error('Server error. Check console for details. (Likely auth issue)');
                }
                return;
            }

            message.success(
                editingRecord
                    ? 'Booking updated successfully!'
                    : 'New booking added successfully!'
            );

            setIsModalVisible(false);
            form.resetFields();
            setEditingRecord(null);

            // For a new creation, switch to page 1 to see the new item immediately
            const targetPage = editingRecord ? currentPage : 1;
            fetchBookings(targetPage);
        } catch (error) {
            console.error('Failed to save booking:', error);
            message.error('Failed to save booking.');
        }
    };

    // (DELETE) Handle the delete button with page shift logic
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/bookings/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`Failed to delete booking (${res.status}):`, errorText.substring(0, 200));
                message.error('Failed to delete booking. Check console for API error.');
                return;
            }

            message.success('Booking deleted successfully!');

            // --- CORRECT PAGINATION DELETION FIX ---
            const newTotalItems = totalItems - 1;

            let newPage = currentPage;

            // If the current page had exactly one item (the one we just deleted) 
            // AND we were not on the first page, we shift back one page.
            if (bookings.length === 1 && currentPage > 1 && newTotalItems > 0) {
                newPage = currentPage - 1;
                console.log(`Deleted last item on page ${currentPage}. Shifting to page ${newPage}.`);
            } else if (newTotalItems === 0) {
                newPage = 1; // If all items are deleted, reset to page 1
            }

            // Update total items state and fetch the new page data
            setTotalItems(newTotalItems);
            fetchBookings(newPage);
            // --- END PAGINATION DELETION FIX ---

        } catch (error) {
            console.error('Failed to delete booking:', error);
            message.error('Failed to delete booking.');
        }
    };


    // --- Render ---

    return (
        <div>
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: '24px' }}
            >
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        Manage Bookings
                    </Title>
                    <Text type="secondary" style={{ display: 'block' }}>
                        Add, edit, or view all hotel bookings (Total: {totalItems}).
                    </Text>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showAddModal}
                        size="large"
                    >
                        Add New Booking
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="id"
                loading={loading}
                onChange={handleTableChange}
                pagination={{
                    pageSize: pageSize, // Fixed page size
                    current: currentPage, // Controlled current page
                    total: totalItems, // Total number of records from the API
                    showSizeChanger: false, // Disabling size changer for simplicity
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}
            />

            {/* --- Add/Edit Modal (Unchanged) --- */}
            <Modal
                title={editingRecord ? 'Edit Booking' : 'Add New Booking'}
                open={isModalVisible}
                onCancel={handleModalCancel}
                onOk={() => form.submit()}
                okText="Save"
                width={600}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    initialValues={{ status: 'PENDING' }}
                >
                    <Form.Item
                        name="guest" // Changed to 'guest' (ID)
                        label="Guest"
                        rules={[{ required: true, message: 'Please select a guest' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Search for a guest"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {allGuests.map((guest) => (
                                <Option key={guest.id} value={guest.id}>
                                    {guest.name} ({guest.email})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="room_type" // Changed to 'room_type' (ID)
                        label="Room Type"
                        rules={[{ required: true, message: 'Please select a room type' }]}
                    >
                        <Select placeholder="Select a room type">
                            {allRoomTypes.map((rt) => (
                                <Option key={rt.id} value={rt.id}>
                                    {rt.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="dates"
                        label="Check-in / Check-out"
                        rules={[{ required: true, message: 'Please select the dates' }]}
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="PENDING">Pending</Option>
                            <Option value="CONFIRMED">Confirmed</Option>
                            <Option value="CANCELLED">Cancelled</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="total_price" // Match API
                        label="Total Price"
                        rules={[
                            { required: true, message: 'Please enter the total price' },
                        ]}
                    >
                        <InputNumber
                            prefix="LKR"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                        />
                    </Form.Item>

                    <Form.Item
                        name="special_requests" // Match API
                        label="Special Requests (Optional)"
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}