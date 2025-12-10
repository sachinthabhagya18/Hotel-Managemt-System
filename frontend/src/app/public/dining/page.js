'use client';

import React from 'react';
import { Typography, Card, Button, Row, Col, Tag, Divider } from 'antd';
import { ClockCircleOutlined, PhoneOutlined, CalendarOutlined, StarFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function PublicDiningPage() {
  
  const venues = [
    {
      id: 1,
      name: "The Azure Grill",
      cuisine: "Fine Dining & Seafood",
      description: "Experience the freshest catch of the day with panoramic ocean views. Our signature restaurant offers a romantic setting perfect for special occasions.",
      image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      hours: "6:00 PM - 11:00 PM",
      rating: 4.9
    },
    {
      id: 2,
      name: "Sunset Lounge & Bar",
      cuisine: "Cocktails & Tapas",
      description: "Relax by the infinity pool with handcrafted cocktails and light bites. The perfect spot to watch the sun dip below the horizon.",
      image: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      hours: "11:00 AM - 1:00 AM",
      rating: 4.7
    },
    {
      id: 3,
      name: "Garden Café",
      cuisine: "International Breakfast & Brunch",
      description: "Start your day right with our extensive buffet breakfast amidst lush tropical gardens. Offering organic coffee and healthy options.",
      image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      hours: "6:30 AM - 3:00 PM",
      rating: 4.8
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="relative h-[60vh] flex items-center justify-center text-center text-white bg-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Dining Hero" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
        </div>
        <div className="relative z-10 px-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Tag color="gold" className="mb-4 px-3 py-1 text-xs font-bold uppercase tracking-widest border-0">
            World-Class Cuisine
          </Tag>
          <Title level={1} style={{ color: 'white', marginBottom: 16, fontSize: '3.5rem', fontFamily: 'var(--font-serif)' }}>
            A Taste of Paradise
          </Title>
          <Paragraph className="text-lg text-slate-200 max-w-2xl mx-auto">
            From locally sourced seafood to artisan cocktails, embark on a culinary journey that delights all the senses.
          </Paragraph>
          <Button type="primary" size="large" className="mt-6 bg-indigo-600 h-12 px-8 border-0 font-medium hover:bg-indigo-500">
            Reserve a Table
          </Button>
        </div>
      </div>

      {/* --- VENUES LIST --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <Title level={2}>Our Venues</Title>
          <Text type="secondary" className="text-lg">Discover our distinct dining destinations</Text>
          <div className="w-16 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="space-y-24">
          {venues.map((venue, index) => (
            <div key={venue.id} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Image Side */}
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <img 
                    src={venue.image} 
                    alt={venue.name} 
                    className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center shadow-sm">
                    <StarFilled className="text-yellow-400 mr-1" />
                    <span className="font-bold text-slate-800">{venue.rating}</span>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2">
                <Text className="text-indigo-600 font-bold uppercase tracking-wider text-sm">{venue.cuisine}</Text>
                <Title level={3} className="mt-2 mb-4">{venue.name}</Title>
                <Paragraph className="text-slate-600 text-lg leading-relaxed mb-6">
                  {venue.description}
                </Paragraph>
                
                <div className="flex flex-wrap gap-6 text-slate-500 mb-8">
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-2 text-indigo-500" />
                    <span>{venue.hours}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneOutlined className="mr-2 text-indigo-500" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>

                <div className="flex gap-4">
                    <Button type="primary" size="large" className="bg-slate-900 hover:bg-slate-800 px-8">
                        View Menu
                    </Button>
                    <Button size="large" icon={<CalendarOutlined />}>
                        Book Table
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CHEF'S SPECIAL --- */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Title level={2} className="mb-8">Private Dining Experiences</Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
                <Card variant={false} className="h-full shadow-sm bg-white">
                    <div className="text-4xl mb-4">🏖️</div>
                    <Title level={4}>Beachfront Dinner</Title>
                    <Text type="secondary">A private candlelit dinner on the sand under the stars.</Text>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card variant={false} className="h-full shadow-sm bg-white">
                    <div className="text-4xl mb-4">👨‍🍳</div>
                    <Title level={4}>Chef's Table</Title>
                    <Text type="secondary">Interactive 7-course tasting menu inside the kitchen.</Text>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card variant={false} className="h-full shadow-sm bg-white">
                    <div className="text-4xl mb-4">🍷</div>
                    <Title level={4}>Wine Tasting</Title>
                    <Text type="secondary">Guided tour of our cellar with our head sommelier.</Text>
                </Card>
            </Col>
          </Row>
        </div>
      </div>

    </div>
  );
}