'use client';

import '../globals.css';

import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined, TeamOutlined, ShopOutlined, CalendarOutlined,
    DollarCircleOutlined, SettingOutlined, MenuFoldOutlined,
    MenuUnfoldOutlined, UserOutlined, LogoutOutlined, SolutionOutlined,
    AccountBookOutlined, CarryOutOutlined, DatabaseOutlined,
    AreaChartOutlined, GiftOutlined, CloudServerOutlined,
    CoffeeOutlined, CrownOutlined, MessageOutlined, Banne // <--- ADDED ICON
} from '@ant-design/icons';

import { Layout, Menu, Button, theme, ConfigProvider, Avatar, Dropdown, Space, App as AntdApp, Spin, Tag, Result } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const { Header, Sider, Content, Footer } = Layout;

function getItem(label, key, icon, children) {
    return { key, icon, children, label: <Link href={key}>{label}</Link> };
}

const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
    HOUSEKEEPER: 'HOUSEKEEPER'
};

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [user, setUser] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const currentPath = window.location.pathname.replace(/\/$/, '');

        if (currentPath === '/admin/login') {
            setIsAuthorized(true);
            return;
        }

        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            router.push('/admin/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            const role = parsedUser.role || (parsedUser.is_superuser ? 'SUPER_ADMIN' : 'GUEST');
            parsedUser.role = role;

            if (role === 'GUEST' && !parsedUser.is_superuser && !parsedUser.is_staff) {
                setUser(parsedUser);
                setAccessDenied(true);
                return;
            }

            setUser(parsedUser);
            setIsAuthorized(true);
        } catch (e) {
            localStorage.clear();
            router.push('/admin/login');
        }
    }, [pathname, router]);

    const getMenuItems = (userRole) => {
        const items = [];
        const role = userRole || 'GUEST';

        if (role !== ROLES.HOUSEKEEPER) {
            items.push(getItem('Dashboard', '/admin/dashboard', <AppstoreOutlined />));
        }
        if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF].includes(role)) {
            items.push(getItem('Bookings', '/admin/bookings', <CalendarOutlined />));
            items.push(getItem('Guests', '/admin/guests', <TeamOutlined />));
            items.push(getItem('Dining', '/admin/dining', <CoffeeOutlined />));
            // --- NEW MENU ITEM ---
            items.push(getItem('Events & Weddings', '/admin/events', <CrownOutlined />));
        }
        items.push(getItem('Housekeeping', '/admin/housekeeping', <CarryOutOutlined />));
        if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)) {
            items.push(getItem('Rooms', '/admin/rooms', <ShopOutlined />));
            items.push(getItem('Inventory', '/admin/inventory', <DatabaseOutlined />));
            items.push(getItem('Blogs', '/admin/blogs', <GiftOutlined />));
            items.push(getItem('Payments', '/admin/payments', <DollarCircleOutlined />));
            items.push(getItem('Employees', '/admin/employees', <SolutionOutlined />));
            items.push(getItem('Salary', '/admin/salary', <AccountBookOutlined />));
            items.push(getItem('Reports', '/admin/reports', <AreaChartOutlined />));
            items.push(getItem('Settings', '/admin/settings', <SettingOutlined />));
            items.push(getItem('Messages', '/admin/messages', <MessageOutlined />));
            items.push(getItem('Marketing', '/admin/marketing', <ShopOutlined />));
        }
        // if (role === ROLES.SUPER_ADMIN) {
        //     items.push(getItem('SaaS Management', '/admin/saas/hotels', <CloudServerOutlined />));
        // }
        return items;
    };

    if (typeof window !== 'undefined' && window.location.pathname === '/admin/login') {
        return <ConfigProvider theme={{ token: { colorPrimary: '#4f46e5' } }}><AntdApp>{children}</AntdApp></ConfigProvider>;
    }

    if (accessDenied) {
        return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Result status="403" title="Access Denied" subTitle="Unauthorized." extra={<Button type="primary" onClick={handleLogout}>Login</Button>} /></div>;
    }

    if (!isAuthorized || !user) {
        return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Spin size="large" /></div>;
    }

    const menuItems = getMenuItems(user.role);
    const selectedKey = menuItems.find((item) => item && item.key && pathname.startsWith(item.key))?.key || '/admin/dashboard';
    const userMenuItems = [
        { key: '1', icon: <UserOutlined />, label: 'Profile', onClick: () => router.push('/admin/profile') },
        { key: '2', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
    ];

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#4f46e5', fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' } }}>
            <AntdApp>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider trigger={null} collapsible collapsed={collapsed} width={240} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
                        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                            {collapsed ? <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div> : <div className="flex flex-col items-center"><span className="text-lg font-bold text-indigo-600">Admin Panel</span><Tag color="blue" style={{ marginTop: 4, fontSize: 10 }}>{user.role?.replace('_', ' ') || 'ADMIN'}</Tag></div>}
                        </div>
                        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderRight: 0 }} />
                    </Sider>
                    <Layout>
                        <Header style={{ padding: '0 24px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64 }} />
                            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                                <a onClick={(e) => e.preventDefault()} className="hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                                    <Space><Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} /><div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}><span style={{ color: '#334155', fontWeight: 500 }}>{user.firstName}</span><span style={{ fontSize: '10px', color: '#94a3b8' }}>{user.role}</span></div></Space>
                                </a>
                            </Dropdown>
                        </Header>
                        <Content style={{ margin: '24px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'initial' }}>{children}</Content>
                        <Footer style={{ textAlign: 'center', color: '#94a3b8' }}>Admin Panel ©{new Date().getFullYear()}</Footer>
                    </Layout>
                </Layout>
            </AntdApp>
        </ConfigProvider>
    );
}