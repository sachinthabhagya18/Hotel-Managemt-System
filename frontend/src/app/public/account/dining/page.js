'use client';

import React, { useState, useEffect } from 'react';
import {
    Tabs, Card, Button, Row, Col, Tag, Typography, List, Avatar,
    message, Badge, Drawer, Empty, Spin, Input, Divider
} from 'antd';
import {
    ShoppingCartOutlined, ClockCircleOutlined, PlusOutlined,
    MinusOutlined, FireOutlined, CoffeeOutlined, HomeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

export default function DiningPage() {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState(true);
    const [cartVisible, setCartVisible] = useState(false);
    const [cart, setCart] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [processing, setProcessing] = useState(false);

    // --- NEW STATE FOR ROOM NUMBER ---
    const [roomNumber, setRoomNumber] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const headers = { 'Authorization': `Token ${token}` };

            try {
                const [menuRes, ordersRes] = await Promise.all([
                    fetch(`${API_URL}/food-items/`),
                    fetch(`${API_URL}/food-orders/`, { headers })
                ]);

                if (menuRes.ok) {
                    const data = await menuRes.json();
                    setMenuItems(data.results || data || []);
                }
                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setOrderHistory(data.results || data || []);
                }
            } catch (e) {
                console.error(e);
                messageApi.error("Failed to load menu");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const categories = [
        { key: 'starters', label: 'Starters', icon: <CoffeeOutlined /> },
        { key: 'mains', label: 'Mains', icon: <FireOutlined /> },
        { key: 'drinks', label: 'Beverages', icon: <CoffeeOutlined /> },
        { key: 'dessert', label: 'Desserts', icon: <CoffeeOutlined /> }
    ];

    const groupedMenu = categories.map(cat => ({
        ...cat,
        items: menuItems.filter(i => i.category === cat.key)
    })).filter(cat => cat.items.length > 0);

    const addToCart = (item) => {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
        messageApi.success(`Added ${item.name}`);
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const updateQuantity = (id, val) => {
        if (val < 1) removeFromCart(id);
        else setCart(cart.map(i => i.id === id ? { ...i, quantity: val } : i));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    const handleCheckout = async () => {
        // --- VALIDATION ---
        if (!roomNumber.trim()) {
            messageApi.error("Please enter your Room Number to continue.");
            return;
        }

        setProcessing(true);
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (!userStr || !token) {
            messageApi.error("Please log in.");
            setProcessing(false);
            return;
        }

        const user = JSON.parse(userStr);
        const email = user.email || user.username;

        try {
            // 1. Find Guest ID
            const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const guestsData = await guestRes.json();
            const guests = guestsData.results || guestsData || [];

            if (guests.length === 0) {
                throw new Error("No guest profile found. Please ensure your profile is updated.");
            }
            const guestId = guests[0].id;

            // 2. Create Order Payload with Manual Room Number
            const payload = {
                guest: guestId,
                room_number: roomNumber, // Use state value
                items_json: cart.map(i => ({ name: i.name, qty: i.quantity, price: parseFloat(i.price) })),
                total_price: cartTotal,
                status: 'PENDING'
            };

            const orderRes = await fetch(`${API_URL}/food-orders/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
                body: JSON.stringify(payload)
            });

            if (orderRes.ok) {
                messageApi.success("Order placed successfully! Kitchen notified.");
                setCart([]);
                setCartVisible(false);
                setRoomNumber(''); // Reset room number

                // Reload orders
                const refreshRes = await fetch(`${API_URL}/food-orders/`, { headers: { 'Authorization': `Token ${token}` } });
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setOrderHistory(refreshData.results || refreshData || []);
                }
            } else {
                const err = await orderRes.json();
                console.error(err);
                throw new Error("Failed to submit order.");
            }

        } catch (error) {
            console.error(error);
            messageApi.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Spin size="large" /></div>;

    return (
        <div>
            {contextHolder}
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={3} style={{ margin: 0 }}>Dining & Room Service</Title>
                    <Text type="secondary">Order delicious meals directly to your room.</Text>
                </div>
                <Badge count={cart.reduce((a, b) => a + b.quantity, 0)}>
                    <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => setCartVisible(true)}>Cart</Button>
                </Badge>
            </div>

            <Tabs
                defaultActiveKey="menu"
                items={[
                    {
                        key: 'menu', label: 'Menu', children: (
                            <div>
                                {groupedMenu.length === 0 && <Empty description="Menu is currently empty" />}
                                {groupedMenu.map(cat => (
                                    <div key={cat.key} className="mb-8">
                                        <Title level={4} className="flex items-center gap-2">{cat.icon} {cat.label}</Title>
                                        <Row gutter={[24, 24]}>
                                            {cat.items.map(item => (
                                                <Col xs={24} md={12} lg={8} key={item.id}>
                                                    <Card
                                                        hoverable
                                                        className="h-full flex flex-col"
                                                        cover={
                                                            <div className="h-40 overflow-hidden">
                                                                <img alt={item.name} src={item.image || 'https://placehold.co/300x200'} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                                            </div>
                                                        }
                                                    >
                                                        <Card.Meta title={item.name} description={<span className="line-clamp-2 h-10 block">{item.description}</span>} />
                                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                                            <Text strong className="text-lg text-slate-700">LKR {parseFloat(item.price).toFixed(2)}</Text>
                                                            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => addToCart(item)}>Add</Button>
                                                        </div>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                ))}
                            </div>
                        )
                    },
                    {
                        key: 'history', label: 'Order History', children: (
                            <Card variant={false} className="shadow-sm rounded-xl">
                                {orderHistory.length === 0 ? <Empty description="No past orders" /> : (
                                    <List dataSource={orderHistory} renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<ClockCircleOutlined />} className="bg-blue-50 text-blue-500" />}
                                                title={
                                                    <div className="flex justify-between">
                                                        <Text strong>Order #{item.id}</Text>
                                                        <Tag color={item.status === 'DELIVERED' ? 'green' : 'orange'}>{item.status}</Tag>
                                                    </div>
                                                }
                                                description={
                                                    <div>
                                                        <div className="text-xs text-slate-400 mb-1">{new Date(item.created_at).toLocaleString()} • Room {item.room_number}</div>
                                                        <ul>{item.items_json.map((i, x) => <li key={x} className="text-sm text-slate-600">{i.qty}x {i.name}</li>)}</ul>
                                                    </div>
                                                }
                                            />
                                            <div className="self-center">
                                                <Text strong>LKR {parseFloat(item.total_price).toFixed(2)}</Text>
                                            </div>
                                        </List.Item>
                                    )} />
                                )}
                            </Card>
                        )
                    }
                ]} />

            <Drawer
                title="Your Order"
                open={cartVisible}
                onClose={() => setCartVisible(false)}
                width={400}
                footer={
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <Text>Subtotal</Text>
                            <Text strong>LKR {cartTotal.toFixed(2)}</Text>
                        </div>

                        {/* --- ROOM NUMBER INPUT --- */}
                        <div className="mb-6">
                            <Text strong className="block mb-1 text-slate-600">Delivery Room Number <span className="text-red-500">*</span></Text>
                            <Input
                                placeholder="e.g. 101"
                                size="large"
                                prefix={<HomeOutlined />}
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                status={!roomNumber && cart.length > 0 ? "" : ""} // Optional: Add warning status if empty
                            />
                        </div>

                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={handleCheckout}
                            loading={processing}
                            className="bg-indigo-600 h-12 font-bold"
                            disabled={cart.length === 0}
                        >
                            Place Order (${cartTotal.toFixed(2)})
                        </Button>
                    </div>
                }>
                {cart.length === 0 ? <Empty description="Cart is empty" /> : (
                    <List dataSource={cart} renderItem={item => (
                        <List.Item actions={[<Button size="small" danger type="text" onClick={() => removeFromCart(item.id)}>Remove</Button>]}>
                            <List.Item.Meta
                                title={`${item.name}`}
                                description={
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button size="small" icon={<MinusOutlined className="text-[10px]" />} onClick={() => updateQuantity(item.id, item.quantity - 1)} />
                                        <span>{item.quantity}</span>
                                        <Button size="small" icon={<PlusOutlined className="text-[10px]" />} onClick={() => updateQuantity(item.id, item.quantity + 1)} />
                                    </div>
                                }
                            />
                            <div>LKR {(item.price * item.quantity).toFixed(2)}</div>
                        </List.Item>
                    )} />
                )}
            </Drawer>
        </div>
    );
}