'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Empty, Spin, message, List, Tag } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

// Helper to mock router
const useRouterMock = () => ({ push: (p) => window.location.href = p });

export default function MyEventsPage() {
  const router = useRouterMock();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return;
      const user = JSON.parse(userStr);
      const email = user.email || user.username;

      try {
        const headers = { 'Authorization': `Token ${token}` };
        
        // 1. Get Guest ID
        const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(email)}`, { headers });
        const guests = await guestRes.json();
        const guestId = guests.results?.[0]?.id;

        if (guestId) {
            // 2. Fetch Events for this Guest
            const res = await fetch(`${API_URL}/event-bookings/?guest=${guestId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.results || data || []);
            }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spin size="large" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <Title level={3} style={{ margin: 0 }}>My Events & Weddings</Title>
            <Text type="secondary">Manage your special occasions with us.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          className="bg-indigo-600"
          onClick={() => router.push('/public/account/events/new')}
        >
          Plan an Event
        </Button>
      </div>

      <Card variant={false} className="shadow-sm rounded-xl overflow-hidden">
        {events.length > 0 ? (
          <List 
            itemLayout="horizontal"
            dataSource={events}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta 
                        title={<span className="text-lg">{item.event_type}</span>}
                        description={
                            <div className="space-y-1 mt-1">
                                <div><CalendarOutlined /> {item.start_date} to {item.end_date}</div>
                                <div>Attendees: {item.attendees}</div>
                            </div>
                        }
                    />
                    <div className="text-right">
                         <Tag color={item.status === 'CONFIRMED' ? 'green' : 'orange'}>{item.status}</Tag>
                    </div>
                </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No events planned yet."
            className="py-12"
          >
            <Button type="primary" onClick={() => router.push('/public/account/events/new')}>
              Start Planning
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
}