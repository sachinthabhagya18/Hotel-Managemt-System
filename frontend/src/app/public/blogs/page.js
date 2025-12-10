'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Spin, Tag, Avatar, Button } from 'antd';
import { CalendarOutlined, ArrowRightOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const API_URL = 'http://127.0.0.1:8000/api';

export default function BlogsPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await fetch(`${API_URL}/blogs/`);
                if (res.ok) {
                    const data = await res.json();
                    const results = data.results || data || [];
                    // Filter only published blogs
                    setBlogs(results.filter(blog => blog.is_published));
                }
            } catch (error) {
                console.error("Error fetching blogs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <Tag color="blue" className="mb-4 border-0 bg-indigo-500/30 text-indigo-200">JOURNAL</Tag>
                    <Title level={1} style={{ color: 'white', marginBottom: 16 }}>Latest News & Stories</Title>
                    <Text className="text-slate-300 text-lg">
                        Discover insights, travel tips, and the latest happenings from Azure Coast.
                    </Text>
                </div>
            </div>

            {/* Blog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <Row gutter={[32, 32]}>
                    {blogs.map(blog => (
                        <Col xs={24} md={12} lg={8} key={blog.id}>
                            <Card
                                hoverable
                                className="h-full rounded-2xl overflow-hidden shadow-lg border-0 flex flex-col"
                                stylesbody={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="h-56 w-full relative bg-slate-200">
                                    <img
                                        src={blog.image || `https://placehold.co/600x400/e2e8f0/475569?text=${blog.title}`}
                                        alt={blog.title}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center text-slate-400 text-xs mb-3 space-x-2">
                                        <CalendarOutlined />
                                        <span>{blog.created_at_formatted}</span>
                                        <span className="text-slate-300">•</span>
                                        <UserOutlined />
                                        <span>{blog.author}</span>
                                    </div>

                                    <Title level={4} className="line-clamp-2 mb-3">{blog.title}</Title>
                                    <Paragraph className="text-slate-500 line-clamp-3 flex-grow mb-6">
                                        {blog.content}
                                    </Paragraph>

                                    <Button type="link" className="p-0 font-bold text-indigo-600 hover:text-indigo-800 self-start flex items-center">
                                        Read More <ArrowRightOutlined className="ml-1" />
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {blogs.length === 0 && (
                    <div className="text-center py-20">
                        <Text type="secondary" className="text-lg">No stories published yet. Check back soon!</Text>
                    </div>
                )}
            </div>
        </div>
    );
}