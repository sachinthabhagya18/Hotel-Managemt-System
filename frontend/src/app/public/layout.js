'use client';

import '../globals.css'; 
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, App as AntdApp, Button, Avatar, Dropdown, Drawer, Typography, Space } from 'antd';
import { User, Menu as MenuIcon } from 'lucide-react';
import { 
  UserOutlined, LogoutOutlined, DashboardOutlined, 
  FacebookOutlined, InstagramOutlined, TwitterOutlined, 
  PhoneOutlined, MailOutlined, EnvironmentOutlined 
} from '@ant-design/icons';


const { Header, Content, Footer } = Layout;
const { Text, Paragraph } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

export default function PublicLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [hotelSettings, setHotelSettings] = useState(null);

  // --- 1. LOAD USER & HOTEL SETTINGS ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load User
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Load Hotel Settings (Footer Data)
      const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/hotels/`);
            if (res.ok) {
                const data = await res.json();
                const results = data.results || data || [];
                if (results.length > 0) {
                    setHotelSettings(results[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load footer data:", error);
        }
      };
      fetchSettings();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/public');
  };

  const userMenu = {
    items: [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => router.push('/public/account/dashboard'),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign Out',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const menuItems = [
    { key: '/public', label: 'Home' },
    { key: '/public/about', label: 'About Us' }, 
    { key: '/public/rooms', label: 'Rooms & Suites' },
    { key: '/public/account/dining', label: 'Dining' },
    { key: '/public/experiences', label: 'Experiences' },
    { key: '/public/blogs', label: 'Blogs' },
    { key: '/public/contact', label: 'Contact' },
  ];

  const onMenuClick = (info) => {
    router.push(info.key);
    setMobileMenuOpen(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5', 
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <AntdApp>
        <Layout className="min-h-screen bg-white">
          {/* Header */}
          <Header className="sticky top-0 z-50 flex items-center justify-between w-full bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 h-20 shadow-sm">
            
            <div 
              className="flex-shrink-0 cursor-pointer mr-8 flex items-center" 
              onClick={() => router.push('/public')}
            >
               {/* Use Logo from DB if available, else Text */}
               {hotelSettings?.logo_url ? (
                   <img src={hotelSettings.logo_url} alt="Logo" className="h-10 mr-2" onError={(e) => e.target.style.display='none'} />
               ) : null}
              <span className="text-2xl font-serif font-bold text-slate-100 tracking-tight">
                {hotelSettings?.name || 'Azure Coast'}<span className="text-indigo-600">.</span>
              </span>
            </div>

            <div className="hidden md:flex flex-1 justify-center">
              <Menu
                mode="horizontal"
                selectedKeys={[pathname]}
                items={menuItems}
                onClick={onMenuClick}
                className="bg-transparent border-none min-w-[400px] justify-center text-sm font-medium text-slate-600"
                style={{ lineHeight: '78px' }}
              />
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Dropdown menu={userMenu} placement="bottomRight">
                  <Button type="text" className="flex items-center font-medium !text-slate-200">
                    <Avatar 
                      style={{ backgroundColor: '#4f46e5', marginRight: 8 }} 
                      icon={<UserOutlined />} 
                      size="small" 
                    />
                    {user.firstName}
                  </Button>
                </Dropdown>
              ) : (
                <Button 
                  type="text" 
                  className="!text-slate-100 hover:!text-indigo-600 font-medium flex items-center" 
                  icon={<User className="w-4 h-4" />}
                  onClick={() => router.push('/public/account')} 
                >
                  Sign In
                </Button>
              )}
              
              <Button 
                type="primary" 
                className="bg-slate-100 hover:bg-indigo-600 border-none font-medium hidden sm:flex"
                onClick={() => router.push('/public/rooms')}
              >
                Book Now
              </Button>
              
              <button 
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
          </Header>

          <Content className="site-layout-content">
            {children}
          </Content>

          {/* --- DYNAMIC FOOTER --- */}
          <Footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
              
              {/* Column 1: Brand & About */}
              <div>
                <h4 className="text-black font-serif text-xl font-bold mb-6">
                    {hotelSettings?.name || 'Azure Coast Collection'}
                </h4>
                <Paragraph className="text-slate-400 pr-4">
                  {hotelSettings?.cancellation_policy ? 
                    `Policy Highlight: ${hotelSettings.cancellation_policy.substring(0, 100)}...` : 
                    'Experience the perfect blend of luxury and nature. Your ultimate escape awaits.'}
                </Paragraph>
                
                {/* Social Media Links */}
                <Space size="middle" className="mt-4">
                    {hotelSettings?.facebook_url && (
                        <a href={hotelSettings.facebook_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors text-xl">
                            <FacebookOutlined />
                        </a>
                    )}
                    {hotelSettings?.instagram_url && (
                        <a href={hotelSettings.instagram_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors text-xl">
                            <InstagramOutlined />
                        </a>
                    )}
                    <a href="#" className="text-slate-400 hover:text-white transition-colors text-xl"><TwitterOutlined /></a>
                </Space>
              </div>

              {/* Column 2: Contact Info */}
              <div>
                <h4 className="text-black font-bold mb-6 uppercase text-xs tracking-wider">Contact Us</h4>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <EnvironmentOutlined className="mr-3 mt-1 text-indigo-500" />
                        <span>{hotelSettings?.location || '123 Ocean Drive, Malibu, CA'}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneOutlined className="mr-3 text-indigo-500" />
                        <span>{hotelSettings?.contact_phone || '+1 (555) 123-4567'}</span>
                    </div>
                    <div className="flex items-center">
                        <MailOutlined className="mr-3 text-indigo-500" />
                        <span>{hotelSettings?.contact_email || 'concierge@azurecoast.com'}</span>
                    </div>
                </div>
              </div>

              {/* Column 3: Quick Links */}
              <div>
                <h4 className="text-black font-bold mb-6 uppercase text-xs tracking-wider">Guest Services</h4>
                <div className="flex flex-col space-y-2">
                    <a href="/public/rooms" className="hover:text-white transition-colors">Accommodations</a>
                    <a href="/public/dining" className="hover:text-white transition-colors">Dining & Bar</a>
                    <a href="/public/experiences" className="hover:text-white transition-colors">Spa & Wellness</a>
                    <a href="/public/contact" className="hover:text-white transition-colors">Contact Support</a>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-center text-sm text-slate-600">
                © {new Date().getFullYear()} {hotelSettings?.name || 'Azure Coast Hospitality'}. All rights reserved.
            </div>
          </Footer>

          {/* Mobile Menu Drawer */}
          <Drawer
            title="Menu"
            placement="right"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            width={250}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="vertical"
              selectedKeys={[pathname]}
              items={menuItems}
              onClick={onMenuClick}
              style={{ borderRight: 'none' }}
            />
            <div className="p-4 border-t border-slate-100 mt-auto">
               <Button 
                  type="primary" 
                  block
                  className="bg-slate-900 hover:bg-indigo-600 border-none font-medium h-10"
                  onClick={() => {
                    router.push('/public/rooms');
                    setMobileMenuOpen(false);
                  }}
                >
                  Book Now
                </Button>
            </div>
          </Drawer>

        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}