'use client';

import React, { useState } from 'react';
import { Typography, Card, Button, Row, Col, Tag, Modal, Tabs } from 'antd';
import {
    CalendarOutlined, ArrowRightOutlined, StarFilled,
    CompassOutlined, HeartOutlined, RocketOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Fallback image if remote source fails
const FALLBACK_IMAGE = "https://placehold.co/800x600/e2e8f0/475569?text=Image+Unavailable";

export default function ExperiencesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExp, setSelectedExp] = useState(null);

    // Helper to handle broken images
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = FALLBACK_IMAGE;
    };

    const categories = [
        { key: 'adventure', label: 'Adventure', icon: <RocketOutlined /> },
        { key: 'wellness', label: 'Wellness', icon: <HeartOutlined /> },
        { key: 'culture', label: 'Culture & Tours', icon: <CompassOutlined /> },
    ];

    const experiences = [
        {
            id: 1,
            category: 'adventure',
            title: "Sunset Yacht Cruise",
            price: "LKR 120 / person",
            duration: "3 Hours",
            rating: 4.9,
            image: "https://unsplash.com/photos/a-large-white-boat-in-the-middle-of-the-ocean-QMCkErAQEVQ",
            description: "Set sail on a luxury yacht as the sun dips below the horizon. Includes champagne and gourmet canapés."
        },
        {
            id: 2,
            category: 'wellness',
            title: "Oceanfront Spa Retreat",
            price: "LKR 180 / session",
            duration: "90 Mins",
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            description: "Rejuvenate your mind and body with our signature massage treatment in a private open-air pavilion overlooking the sea."
        },
        {
            id: 3,
            category: 'adventure',
            title: "Scuba Diving Expedition",
            price: "LKR 95 / person",
            duration: "4 Hours",
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            description: "Explore the vibrant coral reefs with our certified PADI instructors. Suitable for beginners and pros."
        },
        {
            id: 4,
            category: 'culture',
            title: "Local Culinary Tour",
            price: "LKR 65 / person",
            duration: "5 Hours",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            description: "Taste the authentic flavors of the island. Visit local markets, street food stalls, and a traditional spice farm."
        },
        {
            id: 5,
            category: 'wellness',
            title: "Sunrise Yoga on the Beach",
            price: "LKR 30 / person",
            duration: "60 Mins",
            rating: 4.6,
            image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            description: "Start your day with serenity. Guided yoga sessions suitable for all levels, accompanied by the sound of waves."
        },
        {
            id: 6,
            category: 'culture',
            title: "Heritage City Walk",
            price: "LKR 45 / person",
            duration: "3 Hours",
            rating: 4.5,
            image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            description: "Discover the rich history and architecture of the old town with our expert local historian guide."
        }
    ];

    const handleBook = (exp) => {
        setSelectedExp(exp);
        setIsModalOpen(true);
    };

    // Render Helper for Grid
    const renderGrid = (items) => {
        if (items.length === 0) {
            return <div className="text-center py-20 text-slate-400">No experiences found in this category.</div>;
        }
        return (
            <Row gutter={[32, 32]} className="py-8">
                {items.map(item => (
                    <Col xs={24} md={12} lg={8} key={item.id}>
                        <Card
                            hoverable
                            className="h-full overflow-hidden rounded-2xl border-slate-800 shadow-sm group"
                            bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                            <div className="relative h-56 overflow-hidden bg-slate-100">
                                <img
                                    src={item.image}
                                    // alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                    onError={handleImageError}
                                />
                                <div className="absolute top-4 left-4">
                                    <Tag color="white" className="text-slate-800 font-bold border-0 backdrop-blur-md bg-white/90">
                                        {item.category.toUpperCase()}
                                    </Tag>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <Title level={5} className="!m-0">{item.title}</Title>
                                    <div className="flex items-center text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                        <StarFilled className="text-yellow-400 mr-1" /> {item.rating}
                                    </div>
                                </div>
                                <Paragraph className="text-slate-500 text-sm line-clamp-3 flex-grow mb-4">
                                    {item.description}
                                </Paragraph>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                    <div>
                                        <Text type="secondary" className="text-xs block mb-0.5">Starting from</Text>
                                        <Text strong className="text-indigo-600">{item.price}</Text>
                                    </div>
                                    {/* <Button type="primary" ghost onClick={() => handleBook(item)} className="border-indigo-600 text-indigo-600">
                                        Book <ArrowRightOutlined />
                                    </Button> */}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* --- HERO SECTION --- */}
            <div className="relative h-[60vh] flex items-center justify-center text-center text-white bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Experience Hero"
                        className="w-full h-full object-cover opacity-60"
                        loading="eager"
                        onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70"></div>
                </div>
                <div className="relative z-10 px-4 max-w-3xl mx-auto animate-in zoom-in duration-1000">
                    <Tag color="cyan" className="mb-4 px-3 py-1 text-xs font-bold uppercase tracking-widest border-0">
                        Unforgettable Moments
                    </Tag>
                    <Title level={1} style={{ color: 'white', marginBottom: 16, fontSize: '3.5rem', fontFamily: 'var(--font-serif)' }}>
                        Curated Experiences
                    </Title>
                    <Paragraph className="text-lg text-slate-200 max-w-xl mx-auto leading-relaxed">
                        Go beyond the ordinary. Whether you seek adrenaline, relaxation, or cultural immersion, we have crafted the perfect itinerary for you.
                    </Paragraph>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-16 relative z-20">

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <Tabs
                        defaultActiveKey="all"
                        centered
                        size="large"
                        items={[
                            { key: 'all', label: 'All Experiences', children: renderGrid(experiences) },
                            ...categories.map(cat => ({
                                key: cat.key,
                                label: <span>{cat.icon} {cat.label}</span>,
                                children: renderGrid(experiences.filter(e => e.category === cat.key))
                            }))
                        ]}
                    />
                </div>

                {/* --- CALL TO ACTION --- */}
                <div className="mt-24 text-center">
                    <Title level={2}>Need a Custom Itinerary?</Title>
                    <Paragraph className="text-slate-500 mb-8 max-w-xl mx-auto">
                        Our concierge team specializes in creating bespoke experiences tailored to your specific interests and occasions.
                    </Paragraph>
                    {/* <Button size="large" type="primary" className="bg-slate-900 h-12 px-8">
                        Contact Concierge
                    </Button> */}
                </div>

            </div>

            {/* --- BOOKING MODAL --- */}
            <Modal
                title={<span className="text-lg font-serif">Book Experience</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
            >
                {selectedExp && (
                    <div className="text-center p-4">
                        <div className="mb-6 rounded-xl overflow-hidden h-48 w-full relative bg-slate-200">
                            <img
                                src={selectedExp.image}
                                className="w-full h-full object-cover"
                                alt={selectedExp.title}
                                onError={handleImageError}
                            />
                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg font-bold text-xs shadow-sm">
                                {selectedExp.price}
                            </div>
                        </div>
                        <Title level={4}>{selectedExp.title}</Title>
                        <Paragraph type="secondary">{selectedExp.description}</Paragraph>

                        <div className="flex justify-center gap-8 my-6 border-t border-b border-slate-100 py-4">
                            <div>
                                <Text type="secondary" className="text-xs uppercase block">Duration</Text>
                                <Text strong>{selectedExp.duration}</Text>
                            </div>
                            <div>
                                <Text type="secondary" className="text-xs uppercase block">Rating</Text>
                                <div className="flex items-center text-yellow-500">
                                    <StarFilled /> <span className="ml-1 text-slate-800 font-bold">{selectedExp.rating}</span>
                                </div>
                            </div>
                        </div>

                        {/* <Button type="primary" block size="large" className="bg-indigo-600 h-12 font-bold">
                            Confirm Booking Request
                        </Button> */}
                        <Text type="secondary" className="text-xs mt-4 block">
                            * You will be contacted shortly to confirm the specific time slot.
                        </Text>
                    </div>
                )}
            </Modal>
        </div>
    );
}