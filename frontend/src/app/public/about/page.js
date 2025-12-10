'use client';

import React from 'react';
import { Typography, Row, Col, Card, Divider, Avatar, Button } from 'antd';
import {
    HeartOutlined, GlobalOutlined, SafetyCertificateOutlined,
    SmileOutlined, ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AboutPage() {

    const stats = [
        { label: "Years of Excellence", value: "15+" },
        { label: "Luxury Suites", value: "120" },
        { label: "Awards Won", value: "25" },
        { label: "Happy Guests", value: "50k+" },
    ];

    const values = [
        {
            icon: <HeartOutlined className="text-3xl text-rose-500" />,
            title: "Passion for Service",
            desc: "We anticipate your needs before you even speak them. Our dedication to hospitality is woven into every interaction."
        },
        {
            icon: <GlobalOutlined className="text-3xl text-blue-500" />,
            title: "Sustainable Luxury",
            desc: "We believe in protecting our paradise. Our eco-friendly initiatives ensure luxury doesn't cost the earth."
        },
        {
            icon: <SafetyCertificateOutlined className="text-3xl text-emerald-500" />,
            title: "Uncompromised Quality",
            desc: "From the thread count of your sheets to the sourcing of our ingredients, we never settle for less than perfect."
        }
    ];

    const team = [
        { name: "Elena Rossi", role: "General Manager", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
        { name: "Marcus Chen", role: "Executive Chef", image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=400&q=80" },
        { name: "Sarah Jenkins", role: "Head of Concierge", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" },
        { name: "David Miller", role: "Guest Experience", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" },
    ];

    return (
        <div className="min-h-screen bg-white pb-20">

            {/* --- HERO SECTION --- */}
            <div className="relative h-[60vh] flex items-center justify-center text-center text-white bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Hotel Lobby"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
                <div className="relative z-10 px-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <Title level={1} style={{ color: 'white', marginBottom: 24, fontSize: '3.5rem', fontFamily: 'var(--font-serif)' }}>
                        Our Story
                    </Title>
                    <Paragraph className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
                        Redefining the art of hospitality since 2008. Welcome to a world where timeless elegance meets modern comfort.
                    </Paragraph>
                </div>
            </div>

            {/* --- OUR MISSION --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <Row gutter={[64, 48]} align="middle">
                    <Col xs={24} md={12}>
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-indigo-50 rounded-full -z-10"></div>
                            <Title level={2} className="mb-6">More Than Just a Stay</Title>
                            <Paragraph className="text-lg text-slate-600 leading-loose">
                                At Azure Coast, we believe that a hotel is more than just a place to sleep. It is a sanctuary where memories are made, relationships are deepened, and the soul is refreshed.
                            </Paragraph>
                            <Paragraph className="text-lg text-slate-600 leading-loose">
                                Founded on the principles of warmth and genuine care, we have grown from a small boutique inn to an award-winning resort, never losing sight of what matters most: <strong>You.</strong>
                            </Paragraph>
                            <Button type="link" className="p-0 text-indigo-600 font-bold mt-4 text-lg flex items-center">
                                Read our full history <ArrowRightOutlined className="ml-2" />
                            </Button>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className="grid grid-cols-2 gap-4">
                            <img src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=400&q=80" className="rounded-2xl shadow-lg mt-8 w-full h-64 object-cover" alt="Detail 1" />
                            <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80" className="rounded-2xl shadow-lg w-full h-64 object-cover" alt="Detail 2" />
                        </div>
                    </Col>
                </Row>
            </div>

            {/* --- STATS BANNER --- */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <Row gutter={[32, 32]} justify="center">
                        {stats.map((stat, idx) => (
                            <Col xs={12} md={6} key={idx} className="text-center">
                                <div className="text-4xl font-bold text-indigo-400 mb-2">{stat.value}</div>
                                <div className="text-slate-400 uppercase tracking-wider text-sm">{stat.label}</div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>

            {/* --- VALUES SECTION --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <Title level={2}>Our Core Values</Title>
                    <Text className="text-slate-500">The pillars that hold up our promise to you.</Text>
                </div>
                <Row gutter={[32, 32]}>
                    {values.map((val, index) => (
                        <Col xs={24} md={8} key={index}>
                            <Card variant={false} className="h-full shadow-sm hover:shadow-md transition-shadow text-center py-6">
                                <div className="mb-6 p-4 bg-slate-50 rounded-full inline-block">
                                    {val.icon}
                                </div>
                                <Title level={4}>{val.title}</Title>
                                <Paragraph className="text-slate-500">
                                    {val.desc}
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* --- TEAM SECTION --- */}
            {/* <div className="bg-slate-50 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Title level={2}>Meet The Team</Title>
                        <Text className="text-slate-500">The people making the magic happen.</Text>
                    </div>
                    <Row gutter={[32, 32]}>
                        {team.map((member, index) => (
                            <Col xs={12} md={6} key={index}>
                                <div className="text-center group">
                                    <div className="relative mb-4 overflow-hidden rounded-2xl aspect-[3/4]">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                            <div className="text-white font-medium">Say Hello 👋</div>
                                        </div>
                                    </div>
                                    <Title level={4} style={{ marginBottom: 4 }}>{member.name}</Title>
                                    <Text className="text-indigo-600 font-medium">{member.role}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div> */}

        </div>
    );
}