'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { App, Modal, Tag, Button, Spin } from 'antd';
import {
  Filter, ChevronDown, Calendar, Users, Search, MapPin,
  Maximize, ArrowRight, Wifi, Coffee, Wind, MessageCircle,
  X, Send, Bot, User, Star, Quote, BedDouble, CalendarHeart, Globe,
  Gift, Tag as TagIcon, ArrowUpRight
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';
const BASE_URL = 'http://127.0.0.1:8000';

// --- MOCK ROUTER ---
const useRouter = () => {
  return {
    push: (path) => {
      if (typeof window !== 'undefined') window.location.href = path;
    }
  };
};

// --- COMPONENT: BookingHero ---
function BookingHero({ onSearch }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ checkIn, checkOut, guests });
    }
  };

  return (
    <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")' }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center pt-20">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>The Azure Coast Collection</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight mb-6 shadow-sm">
            Find Your <span className="text-indigo-300 italic">Sanctuary</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-12 font-light">
            Experience unpretentious luxury. Where the ocean meets timeless elegance.
          </p>
        </div>

        <div className="w-full max-w-4xl bg-white p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <form onSubmit={handleSearchClick} className="flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group" onClick={() => checkInRef.current?.showPicker()}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600 pointer-events-none">Check In</label>
              <div className="flex items-center space-x-2 text-slate-800">
                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 pointer-events-none" />
                <input ref={checkInRef} type="date" required className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium placeholder-slate-400" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
            <div className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group" onClick={() => checkOutRef.current?.showPicker()}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600 pointer-events-none">Check Out</label>
              <div className="flex items-center space-x-2 text-slate-800">
                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 pointer-events-none" />
                <input ref={checkOutRef} type="date" required min={checkIn} className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium placeholder-slate-400" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} onClick={(e) => e.stopPropagation()} />
              </div>
            </div>
            <div className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600">Guests</label>
              <div className="flex items-center space-x-2 text-slate-800">
                <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                <select className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>
            </div>
            <div className="p-2">
              <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: HomeOffers (New Section) ---
function HomeOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_URL}/promo-banners/`);
        if (res.ok) {
          const data = await res.json();
          const results = data.results || data || [];
          // Only show active offers
          setOffers(results.filter(b => b.is_active));
        }
      } catch (error) {
        console.error("Failed to load offers");
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const getStyleClass = (style) => {
    switch (style) {
      case 'success': return 'bg-emerald-50 border-emerald-100 text-emerald-900';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-900';
      case 'error': return 'bg-rose-50 border-rose-100 text-rose-900';
      default: return 'bg-indigo-50 border-indigo-100 text-indigo-900';
    }
  };

  const getIcon = (style) => {
    switch (style) {
      case 'success': return <Gift className="w-6 h-6 text-emerald-600" />;
      case 'warning': return <TagIcon className="w-6 h-6 text-amber-600" />;
      case 'error': return <TagIcon className="w-6 h-6 text-rose-600" />;
      default: return <Star className="w-6 h-6 text-indigo-600" />;
    }
  };

  // if (loading) return <div className="py-10 text-center"><Spin /></div>;
  if (offers.length === 0) return null; // Don't show section if no offers

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Special Promotions</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2">Exclusive Offers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <div key={offer.id} className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${getStyleClass(offer.style)}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {getIcon(offer.style)}
                </div>
                {offer.style === 'success' && (
                  <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Limited Time</span>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
              <p className="text-sm opacity-80 mb-6 leading-relaxed min-h-[3rem]">
                {offer.message}
              </p>

              {offer.link_url && (
                <a
                  href={offer.link_url}
                  className="inline-flex items-center text-sm font-bold hover:underline"
                >
                  {offer.link_text || 'View Details'} <ArrowUpRight className="w-4 h-4 ml-1" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- COMPONENT: HomeServices ---
function HomeServices() {
  const services = [
    {
      title: "Luxury Accommodation",
      description: "Choose from our wide range of suites and rooms, designed for comfort and elegance with breathtaking ocean views.",
      icon: <BedDouble className="w-6 h-6 text-white" />,
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      link: "/public/rooms",
      cta: "View Rooms"
    },
    {
      title: "Weddings & Events",
      description: "Create unforgettable memories. Our dedicated event team ensures every detail of your special day is perfect.",
      icon: <CalendarHeart className="w-6 h-6 text-white" />,
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
      link: "/public/experiences",
      cta: "Plan Your Event"
    },
    {
      title: "Seamless Booking",
      description: "Experience hassle-free reservations with our secure online booking system. Best rates guaranteed.",
      icon: <Globe className="w-6 h-6 text-white" />,
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      link: "/public/booking",
      cta: "Book Online"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Our Expertise</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2">Exceptional Services</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <div key={index} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-80 w-full relative">
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 z-10" />
                <img src={service.image} alt={service.title} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                <div className="absolute top-6 right-6 z-20 bg-indigo-600/90 backdrop-blur-sm p-3 rounded-xl shadow-lg group-hover:rotate-12 transition-transform duration-300">{service.icon}</div>
              </div>
              <div className="relative bg-white p-8 -mt-12 mx-4 mb-4 rounded-xl shadow-sm border border-slate-100 z-20">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{service.description}</p>
                <a href={service.link} className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-2 transition-transform duration-300">
                  {service.cta} <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- COMPONENT: HomeReviews ---
function HomeReviews() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const reviews = [
    { id: 1, name: "John Doe", initials: "JD", color: "bg-blue-100 text-blue-600", rating: 5, text: "The product quality is amazing! It exceeded all my expectations.", date: "March 15, 2023" },
    { id: 2, name: "Alice Smith", initials: "AS", color: "bg-green-100 text-green-600", rating: 4.5, text: "Great customer service and fast shipping. Highly recommended.", date: "January 28, 2023" },
    { id: 3, name: "Robert Johnson", initials: "RJ", color: "bg-indigo-100 text-indigo-600", rating: 4, text: "Very satisfied with my purchase. The quality is excellent.", date: "February 10, 2023" },
    { id: 4, name: "Sarah Parker", initials: "SP", color: "bg-pink-100 text-pink-600", rating: 5, text: "Absolutely stunning views and the staff went above and beyond.", date: "April 05, 2023" }
  ];
  const infiniteReviews = [...reviews, ...reviews, ...reviews];

  const renderStars = (rating) => [...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    let animationFrameId;
    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += 0.8;
        if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 3)) scrollContainer.scrollLeft = 0;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Guest Stories</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">Don't just take our word for it.</p>
        </div>
        <div className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div ref={scrollRef} className="flex overflow-x-hidden pb-8 gap-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {infiniteReviews.map((review, index) => (
              <div key={`${review.id}-${index}`} className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 select-none">
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 h-full flex flex-col transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${review.color}`}>{review.initials}</div>
                    <div>
                      <h5 className="font-bold text-slate-900">{review.name}</h5>
                      <div className="flex space-x-0.5 mt-1">{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  <Quote className="w-8 h-8 text-indigo-100 mb-4" />
                  <p className="text-slate-600 mb-6 flex-grow italic leading-relaxed">"{review.text}"</p>
                  <div className="pt-4 border-t border-slate-50"><small className="text-slate-400 font-medium">Posted on {review.date}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- COMPONENT: RoomCard ---
function RoomCard({ room, onBook }) {
  const getAmenityIcon = (amenity) => {
    const name = typeof amenity === 'object' ? amenity.name : amenity;
    if (!name || typeof name !== 'string') return <div className="w-1.5 h-1.5 rounded-full bg-current" />;
    const lower = name.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="w-3 h-3" />;
    if (lower.includes('coffee')) return <Coffee className="w-3 h-3" />;
    if (lower.includes('ac')) return <Wind className="w-3 h-3" />;
    return <div className="w-1.5 h-1.5 rounded-full bg-current" />;
  };

  return (
    <div className="group h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-300 flex flex-col md:flex-row">
      <div className="relative h-64 md:h-auto md:w-2/5 overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
            {room.type || 'Standard'}
          </span>
        </div>
        <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-2xl font-serif font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{room.name}</h3>
            <div className="text-right">
              <span className="block text-2xl font-bold text-slate-900">${room.price}</span>
              <span className="text-xs text-slate-500 font-medium uppercase">/ Night</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
            <div className="flex items-center space-x-1"><Users className="w-4 h-4" /><span>Up to {room.capacity} Guests</span></div>
            <div className="flex items-center space-x-1"><Maximize className="w-4 h-4" /><span>{room.size || 400} Sq Ft</span></div>
          </div>
          <p className="text-slate-600 line-clamp-2 mb-6 text-sm leading-relaxed">{room.description}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {room.amenities.slice(0, 4).map((amenity, idx) => {
              const name = typeof amenity === 'object' ? amenity.name : amenity;
              return <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">{getAmenityIcon(name)}<span>{name}</span></span>;
            })}
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <span className="text-xs font-medium text-green-600">Available Now</span>
          <button onClick={() => onBook(room)} className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-indigo-200"><span>Book Now</span><ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: ConciergeChat ---
function ConciergeChat({ availableRooms = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, type: 'bot', text: "Hello! I'm your virtual concierge. How can I help you?" }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, type: 'bot', text: "I'm here to help! Please visit our bookings page for more details." };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600'} text-white`}><MessageCircle className="w-6 h-6" /></button>
      <div className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}`} style={{ maxHeight: '600px', height: '65vh' }}>
        <div className="bg-slate-900 p-4 flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Bot className="w-6 h-6" /></div><div><h3 className="text-white font-bold text-sm">Concierge AI</h3><p className="text-indigo-200 text-xs">Online</p></div></div>
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'bot' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 mr-2 mt-1"><Bot className="w-4 h-4" /></div>}
              <div className={`max-w-[80%] p-3 text-sm rounded-2xl ${msg.type === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="relative">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" />
            <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      </div>
    </>
  );
}

// --- MAIN PAGE ---
export default function PublicHomePage() {
  const { message: antdMessage } = App.useApp();
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchParams, setSearchParams] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Data Fetching
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        setLoadingRooms(true);
        const [typesRes, amenitiesRes] = await Promise.all([
          fetch(`${API_URL}/room-types/`),
          fetch(`${API_URL}/amenities/`)
        ]);

        let fetchedRooms = [];
        let amenityMap = {};

        if (amenitiesRes.ok) {
          const amData = await amenitiesRes.json();
          (amData.results || amData || []).forEach(am => amenityMap[am.id] = am.name);
        }

        if (typesRes.ok) {
          const data = await typesRes.json();
          fetchedRooms = (data.results || data || []).map(rt => ({
            id: rt.id,
            name: rt.name,
            price: parseFloat(rt.price_weekday || 0),
            capacity: rt.capacity || 2,
            type: 'Standard',
            imageUrl: rt.image ? (rt.image.startsWith('http') ? rt.image : `${BASE_URL}${rt.image}`) : `https://placehold.co/800x600/e2e8f0/475569?text=${rt.name.replace(/\s+/g, '+')}`,
            amenities: Array.isArray(rt.amenities) ? rt.amenities.map(id => amenityMap[id] || 'Amenity') : ['Free Wifi'],
            description: `Experience luxury in our ${rt.name}.`,
          }));
        } else {
          console.warn("API request failed, using mock data.");
          fetchedRooms = [
            { id: '1', name: 'Deluxe Ocean View', type: 'Deluxe', price: 350, capacity: 2, description: 'Panoramic views.', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', amenities: ['Free Wifi', 'View'], available: 5 }
          ];
        }
        setRoomTypes(fetchedRooms);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleSearch = (params) => {
    setSearchParams(params);
    document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredRooms = useMemo(() => {
    let rooms = roomTypes;
    if (searchParams?.guests) rooms = rooms.filter(r => r.capacity >= searchParams.guests);
    if (selectedFilter !== 'All') rooms = rooms.filter(r => r.type === selectedFilter || r.name.includes(selectedFilter));
    return rooms;
  }, [searchParams, selectedFilter, roomTypes]);

  const handleBookClick = (room) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      antdMessage.warning("Please sign in to book this room.");
      router.push('/public/account');
    } else {
      router.push('/public/account/bookings/new');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <BookingHero onSearch={handleSearch} />

      <HomeServices />
      <main id="rooms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">{searchParams ? `Available Rooms` : 'Explore Our Collection'}</h2>
            <p className="text-slate-500 mt-2 max-w-xl">{searchParams ? 'Showing filtered results' : 'Handpicked luxury for every occasion.'}</p>
          </div>
          <div className="mt-6 md:mt-0 flex items-center space-x-4 z-20">
            <div className="relative group">
              <button className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-500 transition duration-200">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{selectedFilter}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {['All', 'Standard', 'Deluxe', 'Suite'].map((type) => (
                  <button key={type} onClick={() => setSelectedFilter(type)} className="block w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">{type}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
          {loadingRooms ? <div className="text-center py-20">Loading...</div> : filteredRooms.map(room => (
            <div key={room.id} className="h-auto md:h-[360px]"><RoomCard room={room} onBook={() => handleBookClick(room)} /></div>
          ))}
        </div>
      </main>

      {/* --- INSERTED: HomeOffers Section --- */}
      <HomeOffers />

      <HomeReviews />
      <ConciergeChat availableRooms={roomTypes} />
    </div>
  );
}