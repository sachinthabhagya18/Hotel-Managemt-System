'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

export default function ConciergeChat({ availableRooms = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: "Hello! I'm your virtual concierge. I can help you find the perfect room. Are you looking for a Suite, something with a View, or maybe a specific price range?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const generateResponse = (userInput) => {
        const lowerInput = userInput.toLowerCase();
        let responseText = "";
        let recommendations = [];

        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            responseText = "Welcome back! How can I assist with your booking today?";
        } else if (lowerInput.includes('price') || lowerInput.includes('cheap') || lowerInput.includes('cost')) {
            recommendations = [...availableRooms].sort((a, b) => a.price - b.price).slice(0, 2);
            responseText = "I've found our best value options for you:";
        } else if (lowerInput.includes('suite') || lowerInput.includes('luxury')) {
            recommendations = availableRooms.filter(r => r.type === 'Suite' || r.price > 400).slice(0, 2);
            responseText = recommendations.length ? "Here are our most luxurious suites:" : "I couldn't find any suites available right now, but here is our best room:";
            if (!recommendations.length) recommendations = [availableRooms[0]];
        } else if (lowerInput.includes('view') || lowerInput.includes('ocean')) {
            recommendations = availableRooms.filter(r => r.name.toLowerCase().includes('view') || r.name.toLowerCase().includes('ocean')).slice(0, 2);
            responseText = "These rooms offer breathtaking views:";
        } else {
            responseText = "I can filter by price, view, or room type (like Suites). What is your preference?";
        }

        return { text: responseText, rooms: recommendations };
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate API delay
        setTimeout(() => {
            const { text, rooms } = generateResponse(userMsg.text);
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text,
                rooms
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600'
                    } text-white`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
                    }`}
                style={{ maxHeight: '600px', height: '65vh' }}
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Concierge AI</h3>
                        <p className="text-indigo-200 text-xs flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                            Online
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {msg.type === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 shrink-0 flex items-center justify-center text-indigo-600 mr-2 mt-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`p-3 text-sm rounded-2xl ${msg.type === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>

                                {/* Render Recommended Rooms inside Chat */}
                                {msg.rooms && msg.rooms.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {msg.rooms.map(room => (
                                            <div key={room.id} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col">
                                                <div className="h-20 w-full rounded-lg bg-slate-200 overflow-hidden mb-2 relative">
                                                    <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        ${room.price}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{room.name}</p>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">{room.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.type === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 ml-2 mt-1">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start items-center space-x-1 ml-10">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about suites, views..."
                            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}