'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Card, Button, Row, Col, Tag, Spin,
    Select, Slider, Input, Empty, Divider, message
} from 'antd';
import {
    UserOutlined, HomeOutlined, CheckOutlined,
    ArrowRightOutlined, WifiOutlined, CoffeeOutlined,
    SearchOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Define Base URL for Media files
const BASE_URL = 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

export default function RoomsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);

    // Filters State
    const [maxPrice, setMaxPrice] = useState(2000);
    const [priceRange, setPriceRange] = useState([0, 2000]);
    const [capacityFilter, setCapacityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // --- 1. FETCH DATA FROM DATABASE ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Room Types & Amenities in parallel
                // We need amenities map because Room Types only return Amenity IDs (e.g., [1, 2])
                const [typesRes, amenitiesRes] = await Promise.all([
                    fetch(`${API_URL}/room-types/`),
                    fetch(`${API_URL}/amenities/`)
                ]);

                let roomTypes = [];
                let amenityMap = {};

                // Process Amenities
                if (amenitiesRes.ok) {
                    const amData = await amenitiesRes.json();
                    const amList = amData.results || amData || [];
                    // Create a lookup map: { 1: "WiFi", 2: "Pool" }
                    amList.forEach(am => {
                        amenityMap[am.id] = am.name;
                    });
                }

                // Process Room Types
                if (typesRes.ok) {
                    const data = await typesRes.json();
                    const rawTypes = data.results || data || [];

                    // Transform Database Data for UI
                    roomTypes = rawTypes.map(rt => {
                        // Handle Image URL (Prepend backend URL if it's a relative path)
                        let imgUrl = `https://placehold.co/600x400/e2e8f0/475569?text=${rt.name.replace(/\s+/g, '+')}`;
                        if (rt.image) {
                            imgUrl = rt.image.startsWith('http') ? rt.image : `${BASE_URL}${rt.image}`;
                        }

                        // Map Amenity IDs to Names
                        const resolvedAmenities = Array.isArray(rt.amenities)
                            ? rt.amenities.map(id => amenityMap[id] || 'Amenity')
                            : ['Free Wifi', 'AC']; // Fallback

                        return {
                            id: rt.id,
                            name: rt.name,
                            price: parseFloat(rt.price_weekday || 0), // Use Weekday price as default display
                            capacity: rt.capacity || 2,
                            description: `Experience the ${rt.name}. A perfect choice for your stay.`, // API doesn't have description yet, using template
                            imageUrl: imgUrl,
                            amenities: resolvedAmenities,
                            type: 'Standard' // Or derive from name if needed
                        };
                    });
                } else {
                    // Fallback only if API completely fails
                    console.warn("API Unreachable, using fallback data");
                    roomTypes = [];
                }

                setRooms(roomTypes);

                // Calculate Max Price dynamically based on DB data
                if (roomTypes.length > 0) {
                    const highestPrice = roomTypes.reduce((max, room) => Math.max(max, room.price), 0);
                    const ceiling = Math.ceil(highestPrice / 100) * 100 + 100; // Add buffer
                    setMaxPrice(ceiling);
                    setPriceRange([0, ceiling]);
                }

            } catch (error) {
                console.error('Fetch error:', error);
                message.error("Could not load room data. Please ensure the server is running.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- 2. FILTER LOGIC ---
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const price = room.price;
            const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

            const capacity = room.capacity;
            const matchesCapacity = capacityFilter === 'all' || capacity >= parseInt(capacityFilter);

            const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesPrice && matchesCapacity && matchesSearch;
        });
    }, [rooms, priceRange, capacityFilter, searchQuery]);

    // --- 3. PROTECTED BOOKING HANDLER ---
    const handleBookNow = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // message.warning("Please sign in to book a room.");
            router.push('/public/account');
        } else {
            router.push('/public/account/bookings/new');
        }
    };

    // --- UI HELPERS ---
    const getAmenityIcon = (amenity) => {
        const lower = typeof amenity === 'string' ? amenity.toLowerCase() : '';
        if (lower.includes('wifi')) return <WifiOutlined />;
        if (lower.includes('coffee') || lower.includes('breakfast')) return <CoffeeOutlined />;
        return <CheckOutlined />;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Hero Header */}
            <div className="bg-slate-900 text-white py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <img
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        className="w-full h-full object-cover"
                        alt="Header"
                    />
                </div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <Title level={1} style={{ color: 'white', marginBottom: 16 }}>Accommodations</Title>
                    <Text className="text-slate-100 text-lg">
                        From cozy garden retreats to expansive ocean-view suites, find the perfect space for your next escape.
                    </Text>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">

                {/* Filters Bar */}
                <Card className="shadow-lg rounded-xl border-0 mb-7" stylesbody={{ padding: '24px' }}>
                    <Row gutter={[24, 24]} align="middle">
                        <Col xs={24} md={8}>
                            <Text strong className="block mb-2">Search Rooms</Text>
                            <Input
                                prefix={<SearchOutlined className="text-slate-400" />}
                                placeholder="e.g. Ocean View"
                                size="large"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Text strong className="block mb-2">Price Range (LKR {priceRange[0]} - LKR {priceRange[1]})</Text>
                            <Slider
                                range
                                min={0}
                                max={maxPrice}
                                step={50}
                                value={priceRange}
                                onChange={setPriceRange}
                                trackStyle={[{ backgroundColor: '#4f46e5' }]}
                                handleStyle={[{ borderColor: '#4f46e5' }, { borderColor: '#4f46e5' }]}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Text strong className="block mb-2">Guests</Text>
                            <Select
                                defaultValue="all"
                                size="large"
                                className="w-full"
                                onChange={setCapacityFilter}
                            >
                                <Select.Option value="all">Any Capacity</Select.Option>
                                <Select.Option value="1">1 Guest</Select.Option>
                                <Select.Option value="2">2 Guests</Select.Option>
                                <Select.Option value="4">4+ Guests</Select.Option>
                            </Select>
                        </Col>
                    </Row>
                </Card>

                {/* Room List */}
                {loading ? (
                    <div className="text-center py-20">
                        {/* <Spin size="large" tip="Loading Rooms..." /> */}
                    </div>
                ) : filteredRooms.length > 0 ? (
                    <Row gutter={[32, 32]}>
                        {filteredRooms.map(room => (
                            <Col xs={24} key={room.id}>
                                <Card
                                    hoverable
                                    className="overflow-hidden border-0 shadow-sm rounded-2xl hover:shadow-xl transition-all duration-300"
                                    stylesbody={{ padding: 0 }}
                                >
                                    <Row>
                                        {/* Image Side */}
                                        <Col xs={24} md={10} lg={8} className="relative h-64 md:h-auto">
                                            <img
                                                src={room.imageUrl}
                                                alt={room.name}
                                                className="w-full h-full object-cover absolute inset-0"
                                            />
                                            {/* Fallback for Type if not available */}
                                            <div className="absolute top-4 left-4">
                                                <Tag color="blue" className="backdrop-blur-md bg-white/90 text-indigo-800 font-bold border-0">
                                                    {room.name.split(' ')[0] || 'Standard'}
                                                </Tag>
                                            </div>
                                        </Col>

                                        {/* Content Side */}
                                        <Col xs={24} md={14} lg={16} className="p-6 md:p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Title level={3} className="!mb-0 text-slate-800">{room.name}</Title>
                                                    <div className="text-right">
                                                        <Title level={3} className="!mb-0 text-indigo-600">
                                                            LKR {room.price}
                                                        </Title>
                                                        <Text type="secondary" className="text-xs">PER NIGHT</Text>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-4 text-slate-500 mb-4">
                                                    <div className="flex items-center">
                                                        <UserOutlined className="mr-2" /> {room.capacity} Guests
                                                    </div>
                                                    <Divider type="vertical" />
                                                    <div className="flex items-center">
                                                        <HomeOutlined className="mr-2" /> ~400 ft²
                                                    </div>
                                                </div>

                                                <Paragraph className="text-slate-600 mb-6 max-w-2xl leading-relaxed">
                                                    {room.description}
                                                </Paragraph>

                                                {/* Amenities */}
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {room.amenities.slice(0, 5).map((name, idx) => (
                                                        <Tag key={idx} icon={getAmenityIcon(name)} className="px-3 py-1 text-slate-600 bg-slate-50 border-slate-200 rounded-full">
                                                            {name}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-semibold shadow-md shadow-indigo-200"
                                                    onClick={handleBookNow} // Protected Booking
                                                >
                                                    Book Now <ArrowRightOutlined />
                                                </Button>
                                                <Button
                                                    size="large"
                                                    className="h-12 px-8 text-slate-600 hover:text-indigo-600 hover:border-indigo-600"
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
                        <Empty
                            description={<span className="text-slate-500 text-lg">No rooms found matching your filters</span>}
                        />
                        <Button type="primary" ghost onClick={() => {
                            setPriceRange([0, maxPrice]);
                            setCapacityFilter('all');
                            setSearchQuery('');
                        }} className="mt-4">
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}