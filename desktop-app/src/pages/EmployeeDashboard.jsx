import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
    Clock,
    Activity,
    CheckCircle,
    AlertCircle,
    BarChart2,
    MapPin,
    Laptop,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScreenBroadcaster from '../components/ScreenBroadcaster';
import ScreenRecorder from '../components/ScreenRecorder';

const EmployeeDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/employee-login');
    };
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchTodayStats();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchTodayStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/attendance/daily/${today}`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatHours = (hours) => {
        if (!hours) return '0h 0m';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-gray-100 p-8">
            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{user?.full_name}</span>
                        </h1>
                        <p className="text-gray-400 flex items-center gap-2">
                            <Laptop size={16} className="text-blue-400" />
                            Monitoring Active • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1c2e] border border-gray-800 p-4 rounded-2xl shadow-xl">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Current Date</p>
                            <p className="text-lg font-semibold">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <Clock className="text-blue-400" />
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold hover:bg-red-500/20 transition-all group"
                    >
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        Finish Work
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        icon={<Clock className="text-green-400" />}
                        label="Punch In Time"
                        value={stats?.login_time || '--:--'}
                        sublabel="Start of workday"
                        color="green"
                    />
                    <StatCard
                        icon={<Activity className="text-blue-400" />}
                        label="Productive Hours"
                        value={formatHours(stats?.working_hours)}
                        sublabel="Active tracking time"
                        color="blue"
                    />
                    <StatCard
                        icon={<BarChart2 className="text-purple-400" />}
                        label="Idle Time"
                        value={formatHours(stats?.idle_hours)}
                        sublabel="Inactivity detected"
                        color="purple"
                    />
                    <StatCard
                        icon={<CheckCircle className="text-indigo-400" />}
                        label="Work Status"
                        value="Active"
                        sublabel="Syncing live data"
                        color="indigo"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#161827] border border-gray-800 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity size={120} />
                            </div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Activity className="text-blue-400" size={20} />
                                Live Monitoring Status
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-[#0f111a] rounded-2xl border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span>WebRTC Screen Sharing</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 uppercase tracking-tighter">Ready</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0f111a] rounded-2xl border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span>Socket Connectivity</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 uppercase tracking-tighter">Connected</span>
                                </div>

                                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Your activities are being monitored to ensure productivity. Your screen, active applications, and attendance sessions are synced in real-time with the central server.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertCircle className="text-indigo-400" size={20} />
                                Work Information
                            </h3>
                            <ul className="space-y-4 text-gray-400">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    Standard working hours: 9:00 AM - 6:00 PM
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    Automatic idle detection after 5 minutes of inactivity
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-[#161827] border border-gray-800 rounded-3xl p-6 shadow-xl">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-800 pb-4">Session Info</h4>
                            <div className="space-y-4">
                                <InfoRow icon={<MapPin size={16} />} label="IP Address" value="Detecting..." />
                                <InfoRow icon={<Laptop size={16} />} label="PC Name" value={window.trackerAPI ? "Connected" : "Local"} />
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 shadow-xl">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <AlertCircle className="text-amber-500" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-500 mb-2">Privacy Notice</h4>
                                    <p className="text-xs text-amber-500/80 leading-relaxed">
                                        This software captures screenshots and live screen data. Ensure you do not access personal or sensitive information during work hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* These components handle the actual WebRTC and Recording logic but display nothing */}
            <ScreenBroadcaster />
            <ScreenRecorder />
        </div>
    );
};

const StatCard = ({ icon, label, value, sublabel, color }) => {
    const colorMaps = {
        blue: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
        green: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
        purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
        indigo: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
    };

    return (
        <div className={`bg-gradient-to-br ${colorMaps[color]} border rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform duration-300`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800 shadow-inner">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold tracking-tight mb-1">{value}</p>
                <p className="text-xs text-gray-500">{sublabel}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
            {icon}
            <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm font-semibold">{value}</span>
    </div>
);

export default EmployeeDashboard;
