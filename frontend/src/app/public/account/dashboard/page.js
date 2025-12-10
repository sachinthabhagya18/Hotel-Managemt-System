'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, Tag, List, Avatar, Spin, message, Empty } from 'antd';
import {
  CalendarOutlined, DollarCircleOutlined, StarOutlined, ClockCircleOutlined,
  RightOutlined, PlusOutlined, CheckCircleFilled, CloseCircleFilled
} from '@ant-design/icons';

import dayjs from 'dayjs';

const { Title, Text } = Typography;

const API_URL = 'http://127.0.0.1:8000/api';

// --- MOCK ROUTER FOR PREVIEW ---
// const useRouter = () => {
//   return {
//     push: (path) => {
//       console.log('Navigating to:', path);
//       if (typeof window !== 'undefined') {
//         window.location.href = path;
//       }
//     }
//   };
// };
// -------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ firstName: 'Guest' });

  // Dashboard Data State
  const [stats, setStats] = useState({
    totalStays: 0,
    totalSpent: 0,
    loyaltyPoints: 0
  });
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        router.push('/public/account');
        return;
      }

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // --- 1. FETCH REAL DATA ---
        try {
          const headers = { 'Authorization': `Token ${token}` };
          const userEmail = parsedUser.email || parsedUser.username;

          // A. Find Guest Profile by Email
          const guestRes = await fetch(`${API_URL}/guests/?email=${encodeURIComponent(userEmail)}`, { headers });

          if (!guestRes.ok) throw new Error("Could not fetch guest profile");

          const guestData = await guestRes.json();
          const guestsResults = guestData.results || guestData || [];

          // If no guest profile exists, they haven't booked yet. Stop here.
          if (guestsResults.length === 0) {
            setLoading(false);
            return;
          }

          const guestId = guestsResults[0].id;

          // B. Fetch Bookings & Room Types
          const [bookingsRes, roomTypesRes] = await Promise.all([
            fetch(`${API_URL}/bookings/`, { headers }),
            fetch(`${API_URL}/room-types/`)
          ]);

          const bookingsData = await bookingsRes.json();
          const roomTypesData = await roomTypesRes.json();

          const allBookings = bookingsData.results || bookingsData || [];
          const roomTypes = roomTypesData.results || roomTypesData || [];

          // C. Filter Bookings for THIS Guest
          const myBookings = allBookings.filter(b => b.guest === guestId);

          // --- 2. CALCULATE STATS ---
          const validBookings = myBookings.filter(b => b.status !== 'CANCELLED');
          const totalSpent = validBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
          const totalStays = validBookings.length;
          const points = Math.floor(totalSpent / 10); // 1 point per $10

          setStats({
            totalStays,
            totalSpent,
            loyaltyPoints: points
          });

          // --- 3. FIND UPCOMING BOOKING ---
          const today = dayjs();
          const futureBookings = myBookings
            .filter(b => dayjs(b.check_in).isAfter(today) && b.status !== 'CANCELLED')
            .sort((a, b) => dayjs(a.check_in).valueOf() - dayjs(b.check_in).valueOf());

          if (futureBookings.length > 0) {
            const next = futureBookings[0];

            // Find image for this room type
            const roomTypeObj = roomTypes.find(rt => rt.id === next.room_type || rt.name === next.room_type_name);
            let imageUrl = `https://placehold.co/600x400/e2e8f0/475569?text=${(next.room_type_name || 'Room').replace(/\s+/g, '+')}`;

            if (roomTypeObj && roomTypeObj.image) {
              imageUrl = roomTypeObj.image.startsWith('http')
                ? roomTypeObj.image
                : `http://127.0.0.1:8000${roomTypeObj.image}`;
            }

            setUpcomingBooking({
              id: next.id,
              ref: `BK-${next.id}`,
              hotelName: 'Azure Coast Main Resort',
              roomType: next.room_type_name || 'Standard Room',
              checkIn: next.check_in,
              checkOut: next.check_out,
              status: next.status,
              imageUrl: imageUrl
            });
          }

          // --- 4. RECENT ACTIVITY ---
          const activity = myBookings
            .sort((a, b) => new Date(b.created_at || b.check_in) - new Date(a.created_at || a.check_in)) // Sort by newest
            .slice(0, 5) // Take top 5
            .map(b => ({
              id: b.id,
              title: `Booking ${b.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}`,
              description: `${b.room_type_name} • ${b.check_in}`,
              date: dayjs(b.check_in).format('MMM D, YYYY'),
              status: b.status
            }));

          setRecentActivity(activity);

        } catch (error) {
          console.error("Dashboard Load Error:", error);
          // If error, we just show empty dashboard, don't crash
        } finally {
          setLoading(false);
        }
      }
    };

    initializeDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        {/* <Spin size="fullscreen" tip="Loading your dashboard..." /> */}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header Action Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={2} className="!mb-0">Welcome, {user.firstName}</Title>
          <Text type="secondary">Here is what's happening with your account.</Text>
        </div>
        {/* Primary Call to Action */}
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="bg-indigo-600 shadow-md hover:shadow-lg transition-all"
          onClick={() => router.push('/public/account/bookings/new')}
        >
          Book a New Stay
        </Button>
      </div>

      {/* Stats Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="bg-indigo-50 shadow-none border-indigo-100">
            <Statistic
              title={<span className="text-indigo-600 font-medium">Total Stays</span>}
              value={stats.totalStays}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        {/* <Col xs={24} sm={8}>
          <Card layout={false} className="bg-emerald-50 shadow-none border-emerald-100">
            <Statistic 
              title={<span className="text-emerald-600 font-medium">Loyalty Points</span>} 
              value={stats.loyaltyPoints} 
              prefix={<StarOutlined />} 
              valueStyle={{ color: '#059669', fontWeight: 'bold' }}
            />
          </Card>
        </Col> */}
        <Col xs={24} sm={8}>
          <Card className="bg-amber-50 shadow-none border-amber-100">
            <Statistic
              title={<span className="text-amber-600 font-medium">Total Spent</span>}
              value={stats.totalSpent}
              precision={2}
              prefix="LKR"
              valueStyle={{ color: '#d97706', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Upcoming Reservation */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>Upcoming Reservation</Title>
          <Button type="link" className="text-indigo-600 p-0" onClick={() => router.push('/public/account/bookings')}>
            View all bookings <RightOutlined />
          </Button>
        </div>

        {upcomingBooking ? (
          <Card hoverable stylesbody={{ padding: 0 }} className="overflow-hidden rounded-xl border-slate-200">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 h-48 md:h-auto relative bg-slate-100">
                <img
                  src={upcomingBooking.imageUrl}
                  alt="Room"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Tag color="green" className="mb-2">{upcomingBooking.status}</Tag>
                    <Title level={5} style={{ margin: 0 }}>{upcomingBooking.roomType}</Title>
                    <Text type="secondary">{upcomingBooking.hotelName}</Text>
                  </div>
                  <div className="text-right hidden sm:block">
                    <Text strong className="block text-lg">#{upcomingBooking.id}</Text>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <Text type="secondary" className="text-xs uppercase block">Check-in</Text>
                    <Text strong className="text-slate-700">{dayjs(upcomingBooking.checkIn).format('ddd, MMM D')}</Text>
                  </div>
                  <RightOutlined className="text-slate-300" />
                  <div>
                    <Text type="secondary" className="text-xs uppercase block">Check-out</Text>
                    <Text strong className="text-slate-700">{dayjs(upcomingBooking.checkOut).format('ddd, MMM D')}</Text>
                  </div>
                </div>
              </div>
              {/* <div className="bg-slate-50 p-6 flex flex-col justify-center items-center border-l border-slate-100 gap-3 min-w-[200px]">
                  <Button type="primary" className="bg-indigo-600 w-full">Manage Booking</Button>
                  <Button className="w-full">Get Directions</Button>
                </div> */}
            </div>
          </Card>
        ) : (
          <Card className="rounded-xl border-dashed border-slate-300 bg-slate-50 text-center py-8">
            <Empty description="No upcoming trips scheduled" />
            <Button type="primary" ghost className="mt-4" onClick={() => router.push('/public/account/bookings/new')}>
              Book Now
            </Button>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <Title level={4} className="mb-4">Recent Activity</Title>
        <Card className="shadow-sm rounded-xl">
          <List
            itemLayout="horizontal"
            dataSource={recentActivity}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={item.status === 'CANCELLED' ? <CloseCircleFilled /> : <CheckCircleFilled />}
                      className={item.status === 'CANCELLED' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}
                    />
                  }
                  title={<Text strong>{item.title}</Text>}
                  description={item.description}
                />
                <div className="text-right">
                  <Text type="secondary" className="text-xs block">{item.date}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}