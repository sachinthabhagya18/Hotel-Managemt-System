'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

export default function HomeReviews() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const reviews = [
    {
      id: 1,
      name: "John Doe",
      initials: "JD",
      color: "bg-blue-100 text-blue-600",
      rating: 5,
      text: "The product quality is amazing! It exceeded all my expectations. Will definitely buy again.",
      date: "March 15, 2023"
    },
    {
      id: 2,
      name: "Alice Smith",
      initials: "AS",
      color: "bg-green-100 text-green-600",
      rating: 4.5,
      text: "Great customer service and fast shipping. The product works perfectly for my needs.",
      date: "January 28, 2023"
    },
    {
      id: 3,
      name: "Robert Johnson",
      initials: "RJ",
      color: "bg-indigo-100 text-indigo-600",
      rating: 4,
      text: "Very satisfied with my purchase. The quality is excellent and it arrived earlier than expected.",
      date: "February 10, 2023"
    },
    {
      id: 4,
      name: "Sarah Parker",
      initials: "SP",
      color: "bg-pink-100 text-pink-600",
      rating: 5,
      text: "Absolutely stunning views and the staff went above and beyond. A magical experience.",
      date: "April 05, 2023"
    },
    {
      id: 5,
      name: "Michael Brown",
      initials: "MB",
      color: "bg-orange-100 text-orange-600",
      rating: 5,
      text: "The best vacation we've ever had. The suites are spacious and the amenities are top notch.",
      date: "May 12, 2023"
    }
  ];

  // Duplicate reviews to create an seamless infinite scroll effect
  const infiniteReviews = [...reviews, ...reviews, ...reviews];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId;
    const speed = 0.8; // Adjust speed (pixels per frame)

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += speed;

        // If we've scrolled past the first set of reviews (approx 1/3rd of total width), reset to 0
        // This works because we triplicated the array
        if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 3)) {
          scrollContainer.scrollLeft = 0;
        }
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
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Don't just take our word for it. Here's what our guests say about their stay at Azure Coast.
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient masks to fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

          <div
            ref={scrollRef}
            className="flex overflow-x-hidden pb-8 gap-6 py-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {infiniteReviews.map((review, index) => (
              <div
                key={`${review.id}-${index}`}
                className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 select-none"
              >
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 h-full flex flex-col transform hover:-translate-y-1 duration-300">

                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${review.color}`}>
                      {review.initials}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{review.name}</h5>
                      <div className="flex space-x-0.5 mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  <Quote className="w-8 h-8 text-indigo-100 mb-4" />

                  <p className="text-slate-600 mb-6 flex-grow italic leading-relaxed">
                    "{review.text}"
                  </p>

                  <div className="pt-4 border-t border-slate-50">
                    <small className="text-slate-400 font-medium">Posted on {review.date}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Hover to pause</p>
        </div>
      </div>
    </section>
  );
}