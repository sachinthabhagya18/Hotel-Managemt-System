'use client';

import React from 'react';
import { Users, Maximize, ArrowRight, Wifi, Coffee, Wind } from 'lucide-react';

export default function RoomCard({ room, onBook }) {
    // Fallback helper for amenities icons
    const getAmenityIcon = (amenity) => {
        const lower = amenity.toLowerCase();
        if (lower.includes('wifi')) return <Wifi className="w-3 h-3" />;
        if (lower.includes('coffee') || lower.includes('bar')) return <Coffee className="w-3 h-3" />;
        if (lower.includes('ac') || lower.includes('air')) return <Wind className="w-3 h-3" />;
        return <div className="w-1.5 h-1.5 rounded-full bg-current" />;
    };

    return (
        <div className="group h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-300 flex flex-col md:flex-row">

            {/* Image Section */}
            <div className="relative h-64 md:h-auto md:w-2/5 overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {room.type}
                    </span>
                </div>
                <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative">

                {/* Header & Info */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {room.name}
                        </h3>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-slate-900">${room.price}</span>
                            <span className="text-xs text-slate-500 font-medium uppercase">/ Night</span>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>Up to {room.capacity} Guests</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Maximize className="w-4 h-4" />
                            <span>{room.size} Sq Ft</span>
                        </div>
                    </div>

                    <p className="text-slate-600 line-clamp-2 mb-6 text-sm leading-relaxed">
                        {room.description}
                    </p>

                    {/* Amenities Chips */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {room.amenities.slice(0, 4).map((amenity, idx) => (
                            <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                            </span>
                        ))}
                        {room.amenities.length > 4 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-400 text-xs font-medium border border-slate-100">
                                +{room.amenities.length - 4} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer / Action */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex flex-col">
                        {room.available < 3 ? (
                            <span className="text-xs font-bold text-red-600 animate-pulse">
                                Only {room.available} rooms left!
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-green-600">
                                Available Now
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => onBook(room)}
                        className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-indigo-200"
                    >
                        <span>Book Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
}