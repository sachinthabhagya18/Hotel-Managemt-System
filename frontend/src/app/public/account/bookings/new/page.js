'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Card, Steps, DatePicker, Button,
    message, Row, Col, Tag, Spin, Badge, Divider, Empty, Form, Input, Radio, Alert, Modal, App
} from 'antd';
import {
    CalendarOutlined, HomeOutlined, CheckCircleOutlined,
    SearchOutlined, UserOutlined, CreditCardOutlined, LockOutlined,
    BankOutlined, SafetyCertificateOutlined, DownloadOutlined, WalletOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const API_URL = 'http://127.0.0.1:8000/api';
const PAYHERE_URL = "https://sandbox.payhere.lk/pay/checkout";

// --- MOCK ROUTER ---
const useRouter = () => {
    return {
        push: (path) => {
            if (typeof window !== 'undefined') {
                window.location.href = path;
            }
        }
    };
};

export default function NewBookingPage() {
    const router = useRouter();
    const { modal, message: messageApi } = App.useApp();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const [roomTypes, setRoomTypes] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [existingBookings, setExistingBookings] = useState([]);

    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedRoomType, setSelectedRoomType] = useState(null);

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [paymentForm] = Form.useForm();

    // --- 1. HANDLE PAYHERE RETURN (Success/Cancel) ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('payment_status');
            const orderId = params.get('order_id'); // e.g. BK-123
            const amount = params.get('amount'); // Get amount passed back for verification

            if (status === 'success' && orderId) {
                // Force update DB because localhost webhooks don't work
                completePaymentBackend(orderId, amount);
            } else if (status === 'canceled') {
                messageApi.error("Payment was canceled.");
            }
        }
    }, []);

    // Simulates Webhook for Localhost to mark DB as PAID
    const completePaymentBackend = async (orderId, amount) => {
        try {
            const token = localStorage.getItem('authToken');
            // We use the mock "notify" logic or just rely on fetching the booking details
            // Ideally, call the notify endpoint to ensure data consistency
            const res = await fetch(`${API_URL}/payhere/notify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Ideally notify endpoints are public or use a secret, but we include token if needed
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    order_id: orderId,
                    status_code: "2",
                    payment_id: `PAYHERE-${Date.now()}`,
                    payhere_amount: amount || 1000.00,
                    payhere_currency: "LKR",
                    md5sig: "bypass"
                })
            });

            // Clear URL params so we don't re-trigger on refresh
            window.history.replaceState({}, document.title, window.location.pathname);

            // Show Success UI
            fetchBookingDetails(orderId);

        } catch (e) {
            console.error("Payment sync error:", e);
        }
    };

    const fetchBookingDetails = async (id) => {
        const token = localStorage.getItem('authToken');
        const dbId = id.toString().replace('BK-', '');

        try {
            const res = await fetch(`${API_URL}/bookings/${dbId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const booking = await res.json();
                let roomTypeName = booking.room_type_name || "Room";
                let price = booking.total_price;

                // Trigger Success Modal
                finalizeBookingDisplay(booking, price, roomTypeName);
            }
        } catch (e) {
            console.error("Failed to retrieve booking", e);
            messageApi.error("Payment processed, but could not retrieve invoice details.");
        }
    };

    // --- 2. FETCH DATA ---
    useEffect(() => {
        const fetchHotelData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const headers = token ? { 'Authorization': `Token ${token}` } : {};

                const [typesRes, roomsRes, bookingsRes] = await Promise.all([
                    fetch(`${API_URL}/room-types/`, { headers }),
                    fetch(`${API_URL}/rooms/`, { headers }),
                    fetch(`${API_URL}/bookings/`, { headers })
                ]);

                if (typesRes.ok) {
                    const typesData = await typesRes.json();
                    const rawTypes = typesData.results || typesData || [];

                    // --- FIX: Process Room Type Images ---
                    const processedTypes = rawTypes.map(t => ({
                        ...t,
                        // Ensure imageUrl is a full valid URL or a nice fallback
                        imageUrl: t.image
                            ? (t.image.startsWith('http') ? t.image : `${BASE_URL}${t.image}`)
                            : `https://placehold.co/600x400/e2e8f0/475569?text=${(t.name || 'Room').replace(/\s+/g, '+')}`
                    }));

                    setRoomTypes(processedTypes);
                } else {
                    setRoomTypes([]);
                }

                if (roomsRes.ok) setAllRooms((await roomsRes.json()).results || []);
                if (bookingsRes.ok) setExistingBookings((await bookingsRes.json()).results || []);

            } catch (error) {
                messageApi.error("Connection failed. Using local inventory data.");
            } finally {
                setLoading(false);
            }
        };

        fetchHotelData();
    }, []);

    // --- 3. AVAILABILITY LOGIC ---
    const availableRoomTypes = useMemo(() => {
        if (!selectedDates || selectedDates.length < 2) return roomTypes;
        const [start, end] = selectedDates;
        const startDate = dayjs(start);
        const endDate = dayjs(end);

        return roomTypes.map(type => {
            const totalInventory = allRooms.filter(r => r.room_type === type.id || r.room_type_name === type.name).length || 5;
            const conflictingBookings = existingBookings.filter(booking => {
                const isSameType = booking.room_type === type.id || booking.room_type_name === type.name;
                if (!isSameType) return false;
                const bStart = dayjs(booking.check_in);
                const bEnd = dayjs(booking.check_out);
                return startDate.isBefore(bEnd) && endDate.isAfter(bStart);
            });
            const roomsLeft = Math.max(0, totalInventory - conflictingBookings.length);
            return { ...type, roomsLeft, isSoldOut: roomsLeft === 0 };
        });
    }, [selectedDates, roomTypes, allRooms, existingBookings]);

    const handleDateChange = (dates) => {
        setSelectedDates(dates);
        setSelectedRoomType(null);
    };

    const handleRoomSelect = (room) => {
        if (room.isSoldOut) return;
        setSelectedRoomType(room);
        setCurrentStep(2);
    };

    // --- PAYMENT HANDLER ---
    const handlePayment = async () => {
        setProcessingPayment(true);
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            messageApi.error("Please log in to complete your booking.");
            router.push('/public/account');
            return;
        }

        const user = JSON.parse(userStr);
        const userEmail = user.email || user.username;
        const nights = selectedDates[1].diff(selectedDates[0], 'day');
        const pricePerNight = parseFloat(selectedRoomType.price || selectedRoomType.price_weekday);

        // Calculate Total in USD (if backend base is USD)
        const totalUSD = (pricePerNight * nights * 1.10).toFixed(2);
        // Calculate Total in LKR for PayHere (Approx conversion)
        const totalLKR = (pricePerNight * nights * 1.10 * 300).toFixed(2);

        try {
            // A. Find/Create Guest ID
            let guestId = null;
            const searchRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(userEmail)}`, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (searchRes.ok) {
                const results = (await searchRes.json()).results || [];
                const match = results.find(g => g.email.toLowerCase() === userEmail.toLowerCase());
                if (match) guestId = match.id;
            }

            if (!guestId) {
                const newGuestRes = await fetch(`${API_URL}/guests/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                    body: JSON.stringify({
                        name: `${user.firstName} ${user.lastName}`,
                        email: userEmail,
                        phone: user.phone || '0000000000',
                        address: 'Online Booking'
                    })
                });
                if (newGuestRes.ok) guestId = (await newGuestRes.json()).id;
                else throw new Error("Could not verify guest profile.");
            }

            // B. Create PENDING Booking
            const bookingPayload = {
                guest: guestId,
                room_type: selectedRoomType.id,
                check_in: selectedDates[0].format('YYYY-MM-DD'),
                check_out: selectedDates[1].format('YYYY-MM-DD'),
                total_price: totalUSD, // Store USD value in DB
                status: 'PENDING',
                special_requests: `Payment Method: ${paymentMethod.toUpperCase()}`
            };

            const bookingRes = await fetch(`${API_URL}/bookings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                body: JSON.stringify(bookingPayload)
            });

            if (!bookingRes.ok) throw new Error("Booking initialization failed.");
            const bookingData = await bookingRes.json();

            // C. Initiate Payment (PayHere)
            if (paymentMethod === 'payhere') {
                // 1. Call backend to get Hash
                // IMPORTANT: Send the LKR amount here so backend generates hash for LKR
                const initRes = await fetch(`${API_URL}/payhere/init/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                    body: JSON.stringify({
                        booking_id: bookingData.id,
                        amount: totalLKR, // Send LKR amount for hash generation
                        currency: 'LKR'
                    })
                });

                if (!initRes.ok) {
                    const text = await initRes.text();
                    console.error("Hash Error:", text);
                    throw new Error("Failed to initialize payment security.");
                }

                const payData = await initRes.json();

                // 2. Submit to PayHere Sandbox
                submitPayHereForm({
                    ...payData, // Use hash, order_id, currency from backend response

                    // Ensure Frontend Overrides match Hash Data if needed, or rely on backend
                    // Ideally use backend values:
                    amount: payData.amount,
                    currency: payData.currency || 'LKR',
                    order_id: payData.order_id,

                    // URLs
                    return_url: `${window.location.origin}/public/account/bookings/new?payment_status=success&order_id=${payData.order_id}&amount=${payData.amount}`,
                    cancel_url: `${window.location.origin}/public/account/bookings/new?payment_status=canceled`,
                    notify_url: `${API_URL}/payhere/notify/`,

                    // Customer Details
                    first_name: user.firstName,
                    last_name: user.lastName,
                    email: userEmail,
                    phone: user.phone || "0777123456",
                    address: "No 1, Galle Road",
                    city: "Colombo",
                    country: "Sri Lanka",
                    items: selectedRoomType.name,
                });

            } else {
                // Pay at Hotel (Direct Confirm)
                finalizeBookingDisplay(bookingData, totalLKR, selectedRoomType.name);
            }

        } catch (error) {
            console.error(error);
            messageApi.error(error.message || "Transaction failed.");
            setProcessingPayment(false);
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
        messageApi.loading("Redirecting to Secure Payment Gateway...", 2.5);
        setTimeout(() => form.submit(), 1000);
    };

    const finalizeBookingDisplay = (booking, totalAmount, roomName) => {
        setProcessingPayment(false);
        const inDate = dayjs(booking.check_in).format('MMM DD, YYYY');
        const outDate = dayjs(booking.check_out).format('MMM DD, YYYY');
        const displayId = booking.id;

        modal.success({
            title: null,
            icon: null,
            width: 450,
            centered: true,
            content: (
                <div className="text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleOutlined style={{ fontSize: 32 }} />
                        </div>
                        <Title level={3} style={{ margin: 0 }}>Booking Confirmed!</Title>
                        <Text type="secondary">Invoice #INV-{displayId} generated.</Text>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-white p-0 rounded-xl border border-slate-200 mb-6 overflow-hidden shadow-sm">
                        <div className="bg-slate-900 text-white py-2 px-4 text-xs uppercase font-bold tracking-wider">
                            Digital Boarding Pass
                        </div>
                        <div className="p-6 bg-slate-50">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK-${displayId}`}
                                alt="Check-in QR Code"
                                className="mx-auto mix-blend-multiply mb-4 border-4 border-white rounded-lg shadow-sm"
                            />
                            <Text strong className="block text-2xl tracking-widest font-mono text-slate-800">BK-{displayId}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>Scan at reception kiosk</Text>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="text-left space-y-3 mb-6 border-t border-b border-slate-100 py-4 text-sm">
                        <div className="flex justify-between">
                            <Text type="secondary">Room</Text>
                            <Text strong>{roomName}</Text>
                        </div>
                        <div className="flex justify-between">
                            <Text type="secondary">Check-in</Text>
                            <Text strong>{inDate}</Text>
                        </div>
                        <div className="flex justify-between">
                            <Text type="secondary">Check-out</Text>
                            <Text strong>{outDate}</Text>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                            <Text type="secondary">Total Paid</Text>
                            <Text strong className="text-xl text-green-600">LKR {parseFloat(totalAmount).toFixed(2)}</Text>
                        </div>
                    </div>

                    <Button
                        type="dashed"
                        block
                        icon={<DownloadOutlined />}
                        className="mb-2"
                        onClick={() => messageApi.success('Invoice downloaded successfully')}
                    >
                        Download Invoice PDF
                    </Button>
                </div>
            ),
            onOk: () => router.push('/public/account/bookings'),
            okText: 'View My Bookings',
            okButtonProps: { size: 'large', className: 'bg-indigo-600 w-full' }
        });
    };

    // ... (Render logic) ...
    const renderDateSelection = () => (
        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <Title level={2} className="!mb-2">When would you like to stay?</Title>
                <Text type="secondary" className="text-lg">Select your dates to see availability.</Text>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
                <RangePicker size="large" onChange={handleDateChange} style={{ width: 400 }} format="YYYY-MM-DD" disabledDate={(current) => current && current < dayjs().endOf('day')} />
            </div>
            {selectedDates && selectedDates.length === 2 && (
                <div className="mt-8">
                    <Button type="primary" size="large" className="bg-indigo-600 h-12 px-8 rounded-full" onClick={() => setCurrentStep(1)} icon={<SearchOutlined />}>Find Available Rooms</Button>
                </div>
            )}
        </div>
    );

    const renderRoomSelection = () => (
        <div className="py-4 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-center mb-6">
                <Title level={3} className="!m-0">Available Rooms</Title>
                <Button onClick={() => setCurrentStep(0)}>Change Dates</Button>
            </div>
            <Row gutter={[24, 24]}>
                {availableRoomTypes.map(room => (
                    <Col xs={24} lg={12} key={room.id}>
                        <Card hoverable={!room.isSoldOut} className={`overflow-hidden border-0 shadow-md rounded-2xl h-full ${room.isSoldOut ? 'opacity-60' : ''}`}  onClick={() => !room.isSoldOut && handleRoomSelect(room)}>
                            <div className="flex flex-col sm:flex-row h-full">
                                <div className="sm:w-2/5 h-48 sm:h-auto relative bg-slate-200">
                                    {/* FIX: Use processed imageUrl */}
                                    <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover absolute inset-0" />
                                    {room.isSoldOut && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">Sold Out</div>}
                                </div>
                                <div className="flex-1 p-6">
                                    <Title level={4}>{room.name}</Title>
                                    <div className="text-xl font-bold text-indigo-600">LKR {room.price || room.price_weekday}</div>
                                    <Button type="primary" disabled={room.isSoldOut} className={room.isSoldOut ? "" : "bg-indigo-600 mt-4"}>{room.isSoldOut ? "Unavailable" : "Select"}</Button>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );

    const renderConfirmation = () => {
        if (!selectedRoomType || !selectedDates) return null;
        const nights = selectedDates[1].diff(selectedDates[0], 'day');
        const price = parseFloat(selectedRoomType.price || selectedRoomType.price_weekday);
        const total = (price * nights * 1.10).toFixed(2); // Display in LKR for confirmation

        return (
            <div className="max-w-5xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <Row gutter={[32, 32]}>
                    <Col xs={24} lg={14}>
                        <Card title="Payment Method" className="shadow-md rounded-xl border-slate-200">
                            <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full mb-6">
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Radio.Button value="payhere" className="w-full text-center h-24 flex flex-col items-center justify-center rounded-lg border-2 border-indigo-100 hover:border-indigo-500">
                                            <WalletOutlined className="text-3xl mb-2 text-indigo-600" />
                                            <span className="font-bold text-indigo-900">PayHere</span>
                                            <span className="text-xs text-slate-400">Cards & Digital Wallets</span>
                                        </Radio.Button>
                                    </Col>
                                    <Col span={12}>
                                        <Radio.Button value="hotel" className="w-full text-center h-24 flex flex-col items-center justify-center rounded-lg">
                                            <BankOutlined className="text-3xl mb-2 text-slate-500" />
                                            <span className="font-medium">Pay at Hotel</span>
                                        </Radio.Button>
                                    </Col>
                                </Row>
                            </Radio.Group>

                            {paymentMethod === 'payhere' ? (
                                <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                                    <p className="text-slate-600 mb-4">Securely pay using PayHere Payment Gateway (Sandbox).</p>
                                    <img src="https://www.payhere.lk/downloads/images/payhere_short_banner.png" alt="PayHere" className="h-12 mx-auto mb-2" />
                                </div>
                            ) : (
                                <Alert message="Pay upon arrival" description="A credit card is required for deposit." type="info" showIcon />
                            )}
                        </Card>
                        <Button type="text" className="mt-4 text-slate-500" onClick={() => setCurrentStep(1)}>← Back</Button>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card className="shadow-lg rounded-2xl border-0 bg-slate-50">
                            <div className="mb-6">
                                <Title level={4}>Order Summary</Title>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 text-sm">
                                    <div className="flex justify-between"><Text>Room Charge ({nights} nights)</Text><Text>LKR {((price * nights)).toFixed(2)}</Text></div>
                                    <div className="flex justify-between"><Text>Taxes (10%)</Text><Text>LKR {((price * nights * 0.1)).toFixed(2)}</Text></div>
                                    <Divider className="my-2" />
                                    <div className="flex justify-between"><Text strong className="text-lg">Total</Text><Text strong className="text-2xl text-indigo-600">LKR {total}</Text></div>
                                </div>
                            </div>
                            <Button type="primary" size="large" block className="bg-indigo-600 h-14 font-bold text-lg shadow-lg" loading={processingPayment} onClick={handlePayment}>
                                {paymentMethod === 'payhere' ? `Pay LKR ${total}` : 'Confirm Booking'}
                            </Button>
                            <div className="text-center mt-2 text-xs text-slate-400">1 USD ≈ 300 LKR</div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Add Context Holder */}
            {/* {contextHolder} Not needed since we destructured messageApi from App.useApp() but make sure App wraps parent */}

            <div className="mb-8"><Steps current={currentStep} items={[{ title: 'Dates', icon: <CalendarOutlined /> }, { title: 'Select Room', icon: <HomeOutlined /> }, { title: 'Payment', icon: <CreditCardOutlined /> }]} /></div>
            <div className="min-h-[500px]">
                {loading && currentStep === 0 ? <div className="flex justify-center h-64"><Spin size="large" /></div> : (
                    <>
                        {currentStep === 0 && renderDateSelection()}
                        {currentStep === 1 && renderRoomSelection()}
                        {currentStep === 2 && renderConfirmation()}
                    </>
                )}
            </div>
        </div>
    );
}