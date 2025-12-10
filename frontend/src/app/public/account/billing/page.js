'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Table, Tag, Typography, Statistic, Button, 
  Tabs, Empty, Spin, message, Tooltip, Divider, App, Modal, Form, Radio, Input, Alert 
} from 'antd';
import { 
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  DownloadOutlined, CreditCardOutlined, CoffeeOutlined, 
  WalletOutlined, BankOutlined, UserOutlined, LockOutlined, 
  SafetyCertificateOutlined, ExperimentOutlined
} from '@ant-design/icons';


const { Title, Text } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

const PAYHERE_MERCHANT_ID = "1211149"; 
const PAYHERE_URL = "https://sandbox.payhere.lk/pay/checkout"; 

// --- MOCK ROUTER FOR PREVIEW ---
// const useRouter = () => {
//   return {
//     push: (path) => {
//       if (typeof window !== 'undefined') {
//         window.location.href = path;
//       }
//     }
//   };
// };
// -------------------------------

export default function BillingPage() {
  const router = useRouter();
  // FIX: message and modal from App context
  const { message: messageApi, modal } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [guestProfile, setGuestProfile] = useState(null);
  const [user, setUser] = useState(null); 

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); 
  const [paymentMethod, setPaymentMethod] = useState('payhere');
  
  const [paymentForm] = Form.useForm(); 
  
  // Metrics
  const [stats, setStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pendingInvoices: 0,
    unpaidFood: 0
  });

  // --- 1. HANDLE PAYHERE RETURN & UPDATE DATABASE ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('payment_status');
        const orderId = params.get('order_id'); 
        const amount = params.get('amount');

        if (status === 'success' && orderId) {
            completePaymentBackend(orderId, amount || "0.00");
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'canceled') {
            messageApi.error("Payment process was canceled.");
        }
    }
  }, []);

  const completePaymentBackend = async (orderId, amount) => {
      try {
          const res = await fetch(`${API_URL}/payhere/notify/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  order_id: orderId,
                  status_code: "2",
                  payment_id: `DEMO-${Date.now()}`,
                  payhere_amount: parseFloat(amount),
                  payhere_currency: "LKR",
                  md5sig: "bypass"
              })
          });

          if (res.ok) {
              messageApi.success(`Payment recorded for ${orderId}`);
              fetchData(); // Refresh UI
          } else {
              messageApi.warning("Payment processed but database update failed.");
          }
      } catch (e) {
          console.error("Payment sync error:", e);
      }
  };

  // --- 2. FETCH DATA ---
  const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
          router.push('/public/account');
          return;
      }

      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      const email = parsedUser.email || parsedUser.username;

      try {
        const headers = { 'Authorization': `Token ${token}` };
        
        const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, { headers });
        if (!guestRes.ok) throw new Error("Guest profile not found");
        
        const guestData = await guestRes.json();
        const guestsResults = guestData.results || guestData || [];
        
        if (guestsResults.length === 0) {
            setLoading(false); 
            return;
        }
        const guest = guestsResults[0];
        setGuestProfile(guest); 
        const guestId = guest.id;

        const [invRes, payRes, foodRes, bookingsRes] = await Promise.all([
          fetch(`${API_URL}/invoices/`, { headers }),
          fetch(`${API_URL}/payments/`, { headers }),
          fetch(`${API_URL}/food-orders/`, { headers }),
          fetch(`${API_URL}/bookings/`, { headers }) 
        ]);

        const allInvoices = invRes.ok ? (await invRes.json()).results || [] : [];
        const allPayments = payRes.ok ? (await payRes.json()).results || [] : [];
        const allFood = foodRes.ok ? (await foodRes.json()).results || [] : [];
        const allBookings = bookingsRes.ok ? (await bookingsRes.json()).results || [] : [];

        const myBookingIds = new Set(allBookings.filter(b => b.guest === guestId).map(b => b.id));
        const myInvoices = allInvoices.filter(inv => myBookingIds.has(inv.booking));
        const myInvoiceIds = new Set(myInvoices.map(inv => inv.id));
        const myPayments = allPayments.filter(p => myInvoiceIds.has(p.invoice));
        const myFoodOrders = allFood.filter(f => f.guest === guestId);

        const invoiceDue = myInvoices
            .filter(i => i.status !== 'PAID')
            .reduce((sum, i) => sum + parseFloat(i.amount), 0);

        const foodDue = myFoodOrders
            .filter(f => f.status !== 'DELIVERED' && f.status !== 'CANCELLED') 
            .reduce((sum, f) => sum + parseFloat(f.total_price), 0);

        const paidTotal = myPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const totalOutstanding = invoiceDue + foodDue;

        setInvoices(myInvoices);
        setPayments(myPayments);
        setFoodOrders(myFoodOrders);

        setStats({
            totalPaid: paidTotal,
            totalDue: totalOutstanding > 0 ? totalOutstanding : 0,
            pendingInvoices: myInvoices.filter(i => i.status !== 'PAID').length,
            unpaidFood: foodDue
        });

      } catch (error) {
        console.error("Billing fetch error:", error);
        messageApi.error("Could not load billing history.");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PAYMENT MODAL HANDLERS ---
  const openPaymentModal = (item) => {
      setSelectedInvoice(item);
      setPaymentModalVisible(true);
      paymentForm.resetFields();
  };

  const handleModalOk = async () => {
    if (paymentMethod === 'card') {
        try {
            await paymentForm.validateFields();
        } catch (e) {
            return; 
        }
    }

    setProcessing(true);
    const token = localStorage.getItem('authToken');

    try {
        let amount = 0;
        let orderId = "";
        let itemDescription = "";

        if (selectedInvoice === 'ALL') {
            amount = stats.totalDue;
            orderId = `SETTLE-${guestProfile.id}-${Date.now()}`; 
            itemDescription = `Total Balance Settlement for ${guestProfile.name}`;
        } else if (selectedInvoice) {
            amount = parseFloat(selectedInvoice.amount);
            orderId = `INV-${selectedInvoice.id}`; 
            itemDescription = `Payment for Invoice #${selectedInvoice.id}`;
        }

        if (amount <= 0) {
            messageApi.info("No outstanding balance.");
            setProcessing(false);
            return;
        }

        // 2. Generate Hash
        const hashRes = await fetch(`${API_URL}/payhere-hash/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Token ${token}` 
            },
            body: JSON.stringify({
                order_id: orderId,
                amount: amount.toFixed(2) 
            })
        });

        if (!hashRes.ok) throw new Error("Failed to generate payment security hash.");
        const hashData = await hashRes.json();

        // 3. Submit to PayHere
        submitPayHereForm({
            merchant_id: hashData.merchant_id,
            return_url: `${window.location.origin}/public/account/billing?payment_status=success&order_id=${orderId}&amount=${amount}`,
            cancel_url: `${window.location.origin}/public/account/billing?payment_status=canceled`,
            notify_url: `${API_URL}/payhere/notify/`,
            order_id: orderId,
            items: itemDescription,
            currency: hashData.currency,
            amount: amount.toFixed(2),
            first_name: guestProfile.name.split(' ')[0],
            last_name: guestProfile.name.split(' ').slice(1).join(' ') || "Guest",
            email: guestProfile.email,
            phone: guestProfile.phone,
            address: guestProfile.address || "Hotel Guest",
            city: "Colombo",
            country: "Sri Lanka",
            hash: hashData.hash 
        });

    } catch (error) {
        console.error(error);
        messageApi.error("Payment initialization failed.");
        setProcessing(false);
    }
  };

  const submitPayHereForm = (data) => {
      const form = document.createElement('form');
      form.setAttribute('action', PAYHERE_URL);
      form.setAttribute('method', 'POST');
      form.style.display = 'none';

      Object.keys(data).forEach(key => {
          const input = document.createElement('input');
          input.setAttribute('type', 'hidden');
          input.setAttribute('name', key);
          input.setAttribute('value', data[key]);
          form.appendChild(input);
      });

      document.body.appendChild(form);
      
      // SHOW DEV OPTION
      modal.confirm({
          title: 'Proceed to Payment',
          content: (
              <div>
                  <p>You are about to be redirected to the secure payment gateway.</p>
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <Button 
                        size="small" 
                        icon={<ExperimentOutlined />} 
                        onClick={() => {
                            Modal.destroyAll(); 
                            window.location.href = data.return_url; // DEV BYPASS
                        }}
                    >
                        [Dev] Simulate Success (Skip Gateway)
                    </Button>
                  </div>
              </div>
          ),
          okText: 'Go to PayHere',
          onOk: () => {
              messageApi.loading("Redirecting...", 2.5);
              form.submit();
          },
          onCancel: () => {
              setProcessing(false);
          }
      });
  };

  // --- COLUMNS ---
  const invoiceColumns = [
    { title: 'Invoice #', dataIndex: 'id', key: 'id', render: (id) => <Text strong>INV-{id}</Text> },
    { title: 'Booking', dataIndex: 'booking', key: 'booking', render: (b) => <Text>BK-{b}</Text> },
    { title: 'Due Date', dataIndex: 'due_date', key: 'due_date' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a) => <Text strong>LKR {parseFloat(a).toFixed(2)}</Text> },
    { 
        title: 'Status', 
        dataIndex: 'status', 
        key: 'status',
        render: (status) => {
            let color = status === 'PAID' ? 'success' : status === 'PARTIAL' ? 'warning' : 'error';
            return <Tag icon={status === 'PAID' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} color={color}>{status}</Tag>;
        } 
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
            {record.status !== 'PAID' && (
                <Button type="primary" size="small" loading={processing} onClick={() => openPaymentModal(record)}>Pay</Button>
            )}
        </div>
      ),
    },
  ];

  const foodColumns = [
    { title: 'Order ID', dataIndex: 'id', key: 'id', render: (id) => <Text>ORD-{id}</Text> },
    { title: 'Items', dataIndex: 'items_json', key: 'items', render: (items) => <ul className="list-disc pl-4 m-0 text-xs text-slate-600">{Array.isArray(items) ? items.map((i, x) => <li key={x}>{i.qty}x {i.name}</li>) : 'No items'}</ul> },
    { title: 'Total', dataIndex: 'total_price', key: 'total', render: (p) => <Text strong>LKR {parseFloat(p).toFixed(2)}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'DELIVERED' ? 'success' : 'orange'}>{status}</Tag> },
  ];

  const paymentColumns = [
    { title: 'Receipt #', dataIndex: 'id', key: 'id' },
    { title: 'Date', dataIndex: 'payment_date', render: d => d?.split('T')[0] },
    { title: 'Amount', dataIndex: 'amount', render: a => <Text className="text-green-600 font-medium">+ LKR {parseFloat(a).toFixed(2)}</Text> },
    { title: 'Method', dataIndex: 'method', render: m => <Tag>{m}</Tag> }
  ];

  if (loading) return <div className="flex h-96 items-center justify-center"><Spin size="large" /></div>;

  return (
    <div className="space-y-6">
      {/* {contextHolder}  -- Not needed, handled by App.useApp() */}
      <div className="flex justify-between items-center mb-4">
        <div>
            <Title level={3} className="!mb-0">Billing & Invoices</Title>
            <Text type="secondary">Manage your payments and view transaction history.</Text>
        </div>
        {stats.totalDue > 0 && (
            <Button 
                type="primary" 
                danger 
                size="large" 
                icon={<WalletOutlined />} 
                onClick={() => openPaymentModal('ALL')}
            >
                Pay Total Due (LKR {stats.totalDue.toFixed(2)})
            </Button>
        )}
      </div>

      {/* --- METRICS ROW --- */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
            <Card  className="bg-white shadow-sm rounded-xl">
                <Statistic 
                    title="Total Paid (Lifetime)" 
                    value={stats.totalPaid} 
                    precision={2} 
                    prefix="LKR " 
                    valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} 
                    suffix={<CheckCircleOutlined className="text-green-100 absolute right-0 top-0 text-6xl opacity-20" />} 
                />
            </Card>
        </Col>
        <Col xs={24} sm={8}>
            <Card  className="bg-white shadow-sm rounded-xl border-l-4 border-red-400">
                <Statistic 
                    title="Outstanding Balance" 
                    value={stats.totalDue} 
                    precision={2} 
                    prefix="LKR " 
                    valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} 
                />
            </Card>
        </Col>
        <Col xs={24} sm={8}>
            <Card  className="bg-white shadow-sm rounded-xl">
                <Statistic title="Pending Invoices" value={stats.pendingInvoices} valueStyle={{ color: '#faad14', fontWeight: 'bold' }} prefix={<FileTextOutlined />} />
            </Card>
        </Col>
      </Row>

      {/* --- TABLES --- */}
      <Card  className="shadow-sm rounded-xl mt-6">
        <Tabs 
            defaultActiveKey="invoices" 
            items={[
                { key: 'invoices', label: `Invoices (${invoices.length})`, children: <Table dataSource={invoices} columns={invoiceColumns} rowKey="id" pagination={{ pageSize: 5 }} /> },
                { key: 'dining', label: `Food & Services (${foodOrders.length})`, children: <Table dataSource={foodOrders} columns={foodColumns} rowKey="id" pagination={{ pageSize: 5 }} /> },
                { key: 'payments', label: 'Payment History', children: <Table dataSource={payments} columns={paymentColumns} rowKey="id" pagination={{ pageSize: 5 }} /> }
            ]}
        />
      </Card>

      {/* --- PAYMENT MODAL WITH FORM --- */}
      <Modal
        title="Make a Payment"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleModalOk}
        confirmLoading={processing}
        okText={`Pay ${selectedInvoice === 'ALL' ? `Total (LKR ${stats.totalDue})` : 'Now'}`}
        cancelText="Cancel"
      >
        <Radio.Group 
            value={paymentMethod} 
            onChange={e => setPaymentMethod(e.target.value)} 
            className="w-full mb-6"
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Radio.Button value="payhere" className="w-full text-center h-20 flex flex-col items-center justify-center rounded-lg">
                        <WalletOutlined className="text-xl mb-1 text-indigo-600" />
                        <span className="font-medium">PayHere</span>
                    </Radio.Button>
                </Col>
                <Col span={12}>
                    <Radio.Button value="card" className="w-full text-center h-20 flex flex-col items-center justify-center rounded-lg">
                        <CreditCardOutlined className="text-xl mb-1 text-slate-500" />
                        <span className="font-medium">Credit Card</span>
                    </Radio.Button>
                </Col>
            </Row>
        </Radio.Group>

        {paymentMethod === 'card' && (
            <Form form={paymentForm} layout="vertical">
                <Form.Item label="Cardholder Name" name="name" rules={[{ required: true, message: 'Required' }]}>
                    <Input prefix={<UserOutlined />} placeholder="John Doe" />
                </Form.Item>
                <Form.Item label="Card Number" name="number" rules={[{ required: true, message: 'Required' }]}>
                    <Input prefix={<CreditCardOutlined />} placeholder="0000 0000 0000 0000" maxLength={19} />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Expiry" name="expiry" rules={[{ required: true, message: 'Required' }]}>
                            <Input placeholder="MM/YY" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="CVV" name="cvv" rules={[{ required: true, message: 'Required' }]}>
                            <Input prefix={<LockOutlined />} placeholder="123" maxLength={3} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        )}

        {paymentMethod === 'payhere' && (
             <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                <p className="text-slate-600 mb-4">Securely pay using PayHere Gateway.</p>
                <img src="https://www.payhere.lk/downloads/images/payhere_short_banner.png" alt="PayHere" className="h-10 mx-auto" />
            </div>
        )}
      </Modal>
    </div>
  );
}