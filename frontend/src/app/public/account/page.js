'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { App, Spin, Modal } from 'antd';
import { User, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, Phone, Key } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

// --- InputField Component ---
const InputField = ({ name, type = "text", placeholder, icon: Icon, label, value, onChange, error }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className={`h-5 w-5 ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
            </div>
            <input
                name={name} type={type} required
                className={`block w-full pl-10 pr-3 py-3 border bg-white ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-indigo-200 focus:border-indigo-500'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all text-sm font-medium`}
                placeholder={placeholder} value={value || ''} onChange={onChange}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {error}</p>}
    </div>
);

export default function AccountPage() {
    const { message, modal } = App.useApp();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        username: '', email: '', password: '', firstName: '', lastName: '', phone: '',
        resetToken: '', newPassword: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    // --- HELPER: Handle Response Errors ---
    const handleResponse = async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("Non-JSON Response:", text);
            throw new Error(`Server Error (${res.status}). Check backend terminal.`);
        }
        return res.json();
    };

    // --- LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        try {
            const res = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: formData.email, password: formData.password })
            });

            const data = await handleResponse(res);

            if (!res.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('authToken', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                localStorage.setItem('user', JSON.stringify({ firstName: 'Guest', email: formData.email }));
            }

            message.success("Welcome back!");
            setTimeout(() => router.push('/public/account/dashboard'), 1000);
        } catch (error) {
            console.error(error);
            message.error(error.message || "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- SIGNUP ---
    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        try {
            const userRes = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.email, email: formData.email, password: formData.password,
                    first_name: formData.firstName, last_name: formData.lastName,
                })
            });

            const userData = await handleResponse(userRes);

            if (!userRes.ok) {
                const serverErrors = {};
                Object.keys(userData).forEach(key => {
                    serverErrors[key] = Array.isArray(userData[key]) ? userData[key][0] : userData[key];
                });
                setErrors(serverErrors);
                setIsLoading(false);
                return;
            }

            await fetch(`${API_URL}/guests/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                })
            });
            message.success("Account created! Please sign in.");
            setActiveTab('login');
        } catch (error) {
            console.error(error);
            message.error(error.message || "Unable to create account.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FORGOT PASSWORD (REQUEST) ---
    const handleForgot = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/request-reset/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // FIX: Sending 'username' instead of 'email'
                body: JSON.stringify({ username: formData.username })
            });

            const data = await handleResponse(res);

            if (res.ok) {
                if (data.demo_token) {
                    modal.info({
                        title: 'Reset Code Generated',
                        content: (
                            <div className="text-center">
                                <p className="mb-2">Reset code for <b>{formData.username}</b>:</p>
                                <div className="bg-slate-100 p-4 rounded border border-slate-200 font-mono text-3xl tracking-widest font-bold select-all text-slate-700">
                                    {data.demo_token}
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Enter this 4-digit code in the next screen.</p>
                            </div>
                        ),
                        onOk: () => setActiveTab('reset')
                    });
                } else {
                    message.success("Reset code generated.");
                    setActiveTab('reset');
                }
            } else {
                message.error(data.detail || "Username not found.");
            }
        } catch (error) {
            console.error(error);
            message.error(error.message || "Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- RESET PASSWORD (CONFIRM) ---
    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/confirm-reset/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // FIX: Sending 'username' instead of 'email'
                body: JSON.stringify({
                    username: formData.username,
                    token: formData.resetToken,
                    new_password: formData.newPassword
                })
            });

            const data = await handleResponse(res);

            if (res.ok) {
                message.success("Password reset successfully! Please login.");
                setActiveTab('login');
                setFormData(prev => ({ ...prev, password: '', resetToken: '', newPassword: '' }));
            } else {
                message.error(data.token ? "Invalid or expired code." : "Reset failed.");
            }
        } catch (error) {
            console.error(error);
            message.error(error.message || "Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
            <a href="/public" className="absolute top-8 left-8 text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center transition-colors">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Home
            </a>
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[900px]">

                {/* Left Side */}
                <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" alt="Luxury Hotel" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">Stay Sync<span className="text-indigo-400">.</span></h2>
                    </div>
                    <div className="relative z-10 text-sm text-slate-200 space-y-2">
                        <p><CheckCircle className="inline w-4 h-4 mr-2" />Exclusive Member Rates</p>
                        <p><CheckCircle className="inline w-4 h-4 mr-2" />Manage Bookings Easily</p>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto">
                    <div className="max-w-md mx-auto w-full">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                            {activeTab === 'login' && 'Welcome Back'}
                            {activeTab === 'signup' && 'Create Account'}
                            {activeTab === 'forgot' && 'Forgot Password'}
                            {activeTab === 'reset' && 'Reset Password'}
                        </h1>

                        {(activeTab === 'login' || activeTab === 'signup') && (
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-8 mt-6">
                                <button onClick={() => setActiveTab('login')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Sign In</button>
                                <button onClick={() => setActiveTab('signup')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
                            </div>
                        )}

                        {activeTab === 'login' && (
                            <form onSubmit={handleLogin}>
                                <InputField name="email" type="email" label="Email Address" placeholder="you@example.com" icon={Mail} value={formData.email} onChange={handleInputChange} />
                                <InputField name="password" type="password" label="Password" placeholder="••••••••" icon={Lock} value={formData.password} onChange={handleInputChange} />

                                <div className="flex justify-end mb-6">
                                    <button type="button" onClick={() => setActiveTab('forgot')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </button>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center">
                                    {isLoading ? <Spin size="small" className="mr-2" /> : null} {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'signup' && (
                            <form onSubmit={handleSignup}>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField name="firstName" label="First Name" placeholder="Jane" icon={User} value={formData.firstName} onChange={handleInputChange} />
                                    <InputField name="lastName" label="Last Name" placeholder="Doe" icon={User} value={formData.lastName} onChange={handleInputChange} />
                                </div>
                                <InputField name="phone" type="tel" label="Phone Number" placeholder="+1 555 000 0000" icon={Phone} value={formData.phone} onChange={handleInputChange} />
                                <InputField name="email" type="email" label="Email" placeholder="you@example.com" icon={Mail} value={formData.email} onChange={handleInputChange} />
                                <InputField name="password" type="password" label="Password" placeholder="Strong password" icon={Lock} value={formData.password} onChange={handleInputChange} />
                                <button type="submit" disabled={isLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl mt-4 transition-all flex items-center justify-center">
                                    {isLoading ? <Spin size="small" className="mr-2" /> : null} {isLoading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'forgot' && (
                            <form onSubmit={handleForgot} className="mt-4">
                                <p className="text-slate-500 mb-6">Enter your Email and we'll generate a reset code.</p>
                                {/* FIX: Changed to Username input */}
                                <InputField name="username" type="text" label="Email" placeholder="Enter your Email" icon={User} value={formData.username} onChange={handleInputChange} />

                                <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center">
                                    {isLoading ? <Spin size="small" className="mr-2" /> : null} Generate Code
                                </button>
                                <button type="button" onClick={() => setActiveTab('login')} className="w-full mt-4 text-slate-500 text-sm font-medium hover:text-slate-700">
                                    Back to Login
                                </button>
                            </form>
                        )}

                        {activeTab === 'reset' && (
                            <form onSubmit={handleReset} className="mt-4">
                                <div className="bg-blue-50 p-3 rounded-lg mb-6 text-xs text-blue-700 border border-blue-100">
                                    Resetting password for <b>{formData.username}</b>
                                </div>
                                <InputField name="resetToken" type="text" label="Reset Code" placeholder="e.g. 1234" icon={Key} value={formData.resetToken} onChange={handleInputChange} />
                                <InputField name="newPassword" type="password" label="New Password" placeholder="Minimum 8 characters" icon={Lock} value={formData.newPassword} onChange={handleInputChange} />

                                <button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center">
                                    {isLoading ? <Spin size="small" className="mr-2" /> : null} Update Password
                                </button>
                                <button type="button" onClick={() => setActiveTab('login')} className="w-full mt-4 text-slate-500 text-sm font-medium hover:text-slate-700">
                                    Cancel
                                </button>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}