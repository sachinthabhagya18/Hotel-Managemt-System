'use client';

import React, { useState, useRef } from 'react';
import { Calendar, Users, Search, MapPin } from 'lucide-react';

export default function BookingHero({ onSearch }) {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);

    // Refs to programmatically trigger the date picker
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
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                {/* Gradient at bottom for smooth transition to content */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
            </div>

            {/* Hero Content */}
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
                        Experience unpretentious luxury. Where the ocean meets timeless elegance,
                        and every stay is a story waiting to be written.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-4xl bg-white p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    <form onSubmit={handleSearchClick} className="flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-100">

                        {/* Check In */}
                        <div
                            className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group"
                            onClick={() => checkInRef.current?.showPicker()} // Triggers picker when clicking the box
                        >
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600 pointer-events-none">Check In</label>
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 pointer-events-none" />
                                <input
                                    ref={checkInRef}
                                    type="date"
                                    required
                                    className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium placeholder-slate-400"
                                    value={checkIn}
                                    onChange={(e) => setCheckIn(e.target.value)}
                                    onClick={(e) => e.stopPropagation()} // Prevents double-triggering if clicking input directly
                                />
                            </div>
                        </div>

                        {/* Check Out */}
                        <div
                            className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group"
                            onClick={() => checkOutRef.current?.showPicker()} // Triggers picker when clicking the box
                        >
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600 pointer-events-none">Check Out</label>
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 pointer-events-none" />
                                <input
                                    ref={checkOutRef}
                                    type="date"
                                    required
                                    min={checkIn}
                                    className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium placeholder-slate-400"
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Guests */}
                        <div className="flex-1 px-4 py-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 group-hover:text-indigo-600">Guests</label>
                            <div className="flex items-center space-x-2 text-slate-800">
                                <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                <select
                                    className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 w-full cursor-pointer outline-none font-medium"
                                    value={guests}
                                    onChange={(e) => setGuests(Number(e.target.value))}
                                >
                                    <option value="1">1 Guest</option>
                                    <option value="2">2 Guests</option>
                                    <option value="3">3 Guests</option>
                                    <option value="4">4 Guests</option>
                                    <option value="5">5+ Guests</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="p-2">
                            <button
                                type="submit"
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                            >
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