'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Typography,
    Space,
    Modal,
    Form,
    InputNumber,
    DatePicker,
    Avatar,
    message,
    App,
    Select,
    Divider,
    Tag
} from 'antd';
import {
    DollarCircleOutlined,
    UserOutlined,
    HistoryOutlined,
    EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const API_URL = 'http://127.0.0.1:8000/api';
// --- PASTE YOUR TOKEN HERE ---
const AUTH_TOKEN = '0a661eabb872b3794cd72db9b38b5197f4b2b5c5';

export default function SalaryPage() {
    const { message } = App.useApp();

    const [isLogPaymentVisible, setIsLogPaymentVisible] = useState(false);
    const [isEditSalaryVisible, setIsEditSalaryVisible] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    const [logPaymentForm] = Form.useForm();
    const [editSalaryForm] = Form.useForm();

    const [salaryData, setSalaryData] = useState([]);
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [currentStaff, setCurrentStaff] = useState(null);

    // --- 1. FETCH MAIN TABLE DATA ---
    const fetchSalaryData = async () => {
        try {
            setLoading(true);
            // Add timestamp to force fresh data
            const res = await fetch(`${API_URL}/staff/?t=${Date.now()}`, {
                headers: { 'Authorization': `Token ${AUTH_TOKEN}` },
                cache: 'no-store'
            });

            if (!res.ok) throw new Error('Failed to fetch salary data');
            const data = await res.json();

            // DEBUG: Check if 'salary' field exists in console
            console.log("API Data Received:", data.results);

            const formattedData = (data.results || []).map(staff => ({
                id: staff.id,
                key: staff.id,
                name: `${staff.user.first_name} ${staff.user.last_name}`,
                jobTitle: staff.job_title,
                // Map fields directly from API
                baseSalary: staff.salary,
                payFrequency: staff.pay_frequency,
                lastPaymentDate: staff.last_payment_date,
            }));

            setSalaryData(formattedData);
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load salary data.');
        } finally {
            setLoading(false);
        }
    };

    // --- 2. FETCH PAYROLL HISTORY ---
    const fetchPayrollHistory = async (staffId) => {
        try {
            setHistoryLoading(true);
            const res = await fetch(`${API_URL}/payroll/?staff_id=${staffId}&t=${Date.now()}`, {
                headers: { 'Authorization': `Token ${AUTH_TOKEN}` },
                cache: 'no-store'
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setPayrollHistory(data.results || []);
        } catch (error) {
            console.error('History fetch error:', error);
            message.error('Failed to load payroll history.');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (AUTH_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
            message.error('Please paste your AUTH_TOKEN in salary/page.js');
            setLoading(false);
            return;
        }
        fetchSalaryData();
    }, []);

    // --- MODALS ---
    const openEditSalary = (record) => {
        setCurrentStaff(record);
        editSalaryForm.setFieldsValue({
            salary: record.baseSalary,
            pay_frequency: record.payFrequency
        });
        setIsEditSalaryVisible(true);
    };

    const openLogPayment = (record) => {
        setCurrentStaff(record);
        // Calculate default
        const salary = parseFloat(record.baseSalary) || 0;
        let calculatedAmount = 0;
        if (record.payFrequency === 'Monthly') calculatedAmount = salary / 12;
        else if (record.payFrequency === 'Bi-Weekly') calculatedAmount = salary / 26;
        else if (record.payFrequency === 'Weekly') calculatedAmount = salary / 52;

        logPaymentForm.setFieldsValue({
            paymentDate: dayjs(),
            paymentAmount: parseFloat(calculatedAmount.toFixed(2)),
            bonus: 0,
        });
        setIsLogPaymentVisible(true);
    };

    const openHistory = (record) => {
        setCurrentStaff(record);
        setIsHistoryVisible(true);
        fetchPayrollHistory(record.id);
    };

    // --- HANDLERS ---

    // Update Salary (PATCH)
    const handleEditSalarySubmit = async (values) => {
        try {
            const res = await fetch(`${API_URL}/staff/${currentStaff.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify(values)
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("Update Error:", err);
                throw new Error('Failed to update salary');
            }

            message.success('Salary updated successfully!');
            setIsEditSalaryVisible(false);
            fetchSalaryData(); // Refresh
        } catch (error) {
            message.error('Failed to update salary.');
        }
    };

    // Log Payment (POST)
    const handleLogPaymentSubmit = async (values) => {
        if (!currentStaff) return;

        const payrollData = {
            staff: currentStaff.id,
            salary_amount: values.paymentAmount,
            bonus_amount: values.bonus || 0,
            payment_date: values.paymentDate.format('YYYY-MM-DD')
        };

        try {
            const res = await fetch(`${API_URL}/payroll/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${AUTH_TOKEN}`
                },
                body: JSON.stringify(payrollData),
            });

            if (!res.ok) throw new Error('Failed to log payment');

            message.success(`Payment logged successfully!`);
            setIsLogPaymentVisible(false);
            logPaymentForm.resetFields();
            fetchSalaryData(); // Refresh to see Last Payment Date update
        } catch (error) {
            message.error('Failed to log payment.');
        }
    };

    // --- COLUMNS ---
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name) => <Space><Avatar icon={<UserOutlined />} />{name}</Space>,
        },
        {
            title: 'Job Title',
            dataIndex: 'jobTitle',
            key: 'jobTitle',
        },
        {
            title: 'Base Salary (Annual)',
            dataIndex: 'baseSalary',
            key: 'baseSalary',
            render: (salary) => `LKR ${Number(salary || 0).toLocaleString()}`,
        },
        {
            title: 'Frequency',
            dataIndex: 'payFrequency',
            key: 'payFrequency',
        },
        {
            title: 'Last Payment Date',
            dataIndex: 'lastPaymentDate',
            key: 'lastPaymentDate',
            render: (date) => date || <Tag color="orange">Never</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEditSalary(record)}>Edit</Button>
                    <Button icon={<HistoryOutlined />} onClick={() => openHistory(record)}>History</Button>
                    <Button type="primary" icon={<DollarCircleOutlined />} onClick={() => openLogPayment(record)}>Pay</Button>
                </Space>
            ),
        },
    ];

    const historyColumns = [
        { title: 'Date', dataIndex: 'payment_date', key: 'payment_date' },
        { title: 'Salary', dataIndex: 'salary_amount', key: 'salary_amount', render: val => `LKR ${val}` },
        { title: 'Bonus', dataIndex: 'bonus_amount', key: 'bonus_amount', render: val => <span style={{ color: 'green' }}>+${val}</span> },
        { title: 'Total', key: 'total', render: (_, rec) => <b>${(parseFloat(rec.salary_amount) + parseFloat(rec.bonus_amount)).toFixed(2)}</b> }
    ];

    return (
        <div>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <Title level={3} style={{ margin: 0 }}>Salary Management</Title>
                <Table columns={columns} dataSource={salaryData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            </Space>

            <Modal title="Edit Salary" open={isEditSalaryVisible} onCancel={() => setIsEditSalaryVisible(false)} onOk={() => editSalaryForm.submit()} okText="Update">
                <Form form={editSalaryForm} layout="vertical" onFinish={handleEditSalarySubmit}>
                    <Form.Item name="salary" label="Base Salary"><InputNumber prefix="LKR " style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="pay_frequency" label="Frequency"><Select><Option value="Monthly">Monthly</Option><Option value="Bi-Weekly">Bi-Weekly</Option><Option value="Weekly">Weekly</Option></Select></Form.Item>
                </Form>
            </Modal>

            <Modal title="Log Payment" open={isLogPaymentVisible} onCancel={() => setIsLogPaymentVisible(false)} onOk={() => logPaymentForm.submit()} okText="Confirm">
                <Form form={logPaymentForm} layout="vertical" onFinish={handleLogPaymentSubmit}>
                    <Form.Item name="paymentAmount" label="Amount" rules={[{ required: true }]}><InputNumber prefix="LKR " style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="bonus" label="Bonus"><InputNumber prefix="LKR " style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="paymentDate" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            <Modal title="History" open={isHistoryVisible} onCancel={() => setIsHistoryVisible(false)} footer={null} width={700}>
                <Table dataSource={payrollHistory} columns={historyColumns} rowKey="id" loading={historyLoading} pagination={{ pageSize: 5 }} size="small" />
            </Modal>
        </div>
    );
}