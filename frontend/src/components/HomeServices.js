'use client';

import React from 'react';
import { ArrowRight, BedDouble, CalendarHeart, Globe } from 'lucide-react';

export default function HomeServices() {
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

                            {/* Image Background */}
                            <div className="h-80 w-full relative">
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 z-10" />
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700"
                                />

                                {/* Icon Badge */}
                                <div className="absolute top-6 right-6 z-20 bg-indigo-600/90 backdrop-blur-sm p-3 rounded-xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                    {service.icon}
                                </div>
                            </div>

                            {/* Content Card Overlay */}
                            <div className="relative bg-white p-8 -mt-12 mx-4 mb-4 rounded-xl shadow-sm border border-slate-100 z-20">
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                    {service.description}
                                </p>

                                <a
                                    href={service.link}
                                    className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-2 transition-transform duration-300"
                                >
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