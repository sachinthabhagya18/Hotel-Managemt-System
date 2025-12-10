'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Avatar, Typography, Button, Space, Badge, theme, message } from 'antd';
import { 
  UserOutlined, CalendarOutlined, LogoutOutlined, HomeOutlined, 
  CreditCardOutlined, HeartOutlined, CoffeeOutlined, BellOutlined, CrownOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;


export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ firstName: 'Guest', lastName: '' });
  const [loading, setLoading] = useState(true);
  
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    if (pathname === '/public/account') {
        setLoading(false);
        return;
    }

    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (!token) {
        router.push('/public/account');
    } else {
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    message.success("Logged out successfully.");
    router.push('/public/account');
  };

  if (pathname === '/public/account') {
    return <>{children}</>;
  }

  if (loading) return null;

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'Overview', onClick: () => router.push('/public/account/dashboard') },
    { key: 'bookings', icon: <CalendarOutlined />, label: 'My Reservations', onClick: () => router.push('/public/account/bookings') },
    // --- ADDED EVENTS LINK ---
    { key: 'events', icon: <CrownOutlined />, label: 'My Events & Weddings', onClick: () => router.push('/public/account/events') },
    
    { key: 'dining', icon: <CoffeeOutlined />, label: 'Dining & Orders', onClick: () => router.push('/public/account/dining') },
    { key: 'billing', icon: <CreditCardOutlined />, label: 'Billing', onClick: () => router.push('/public/account/billing') },
    { key: 'preferences', icon: <HeartOutlined />, label: 'Preferences', onClick: () => router.push('/public/account/preferences') },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => router.push('/public/account/profile') },
  ];

  const activeKey = menuItems.find(item => pathname.includes(item.key))?.key || 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>My Account</Title>
            <Text type="secondary">Welcome back, {user.firstName}</Text>
          </div>
          <Space size="large">
            <Badge count={2} dot>
              <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} />
            </Badge>
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
              <Avatar style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined />} />
              <div className="hidden md:block leading-tight">
                <Text strong className="block text-sm">{user.firstName} {user.lastName}</Text>
                <Text type="secondary" className="text-xs">Member</Text>
              </div>
            </div>
          </Space>
        </div>

        <Layout style={{ background: 'transparent' }} hasSider>
          <Sider width={280} breakpoint="lg" collapsedWidth="0" style={{ background: 'transparent', marginRight: 32 }} theme="light">
            <div className="flex flex-col h-full">
              <Card style={{ borderRadius: borderRadiusLG, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }} styles={{ padding: '12px' }}>
                <Menu mode="inline" selectedKeys={[activeKey]} style={{ borderRight: 0 }} items={menuItems} className="custom-dashboard-menu" />
              </Card>
              <Card  style={{ marginTop: 24, borderRadius: borderRadiusLG, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <Button block danger type="text" icon={<LogoutOutlined />} onClick={handleLogout}>Sign Out</Button>
              </Card>
            </div>
          </Sider>
          <Content>
            <Card  style={{ minHeight: 600, background: colorBgContainer, borderRadius: borderRadiusLG, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              {children}
            </Card>
          </Content>
        </Layout>
      </div>
    </Layout>
  );
}