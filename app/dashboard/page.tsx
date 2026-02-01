'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle2,
    Clock,
    Users,
    TrendingUp,
    FileDigit,
    QrCode,
    FileUp
} from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        totalUsers: 0
    });

    useEffect(() => {
        // Fetch stats from API
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
                // Mock data for now if API not ready
                setStats({
                    total: 156,
                    approved: 124,
                    pending: 32,
                    totalUsers: 12
                });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                        <FileText size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500">Total Dokumen</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500">Sudah Ditandatangani</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.approved}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                        <Clock size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500">Menunggu TTD</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.pending}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center text-white">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500">Total Pengguna</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.totalUsers}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-blue-600" />
                            Statistik Dokumen Bulanan
                        </h2>
                    </div>

                    <div className="h-64 flex items-end justify-around gap-4 px-4">
                        {[
                            { m: 'Jan', h: '70%' },
                            { m: 'Feb', h: '85%' },
                            { m: 'Mar', h: '60%' },
                            { m: 'Apr', h: '90%' },
                            { m: 'Mei', h: '75%' },
                            { m: 'Jun', h: '95%' }
                        ].map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full bg-blue-50 group-hover:bg-blue-100 rounded-t-lg transition-all relative overflow-hidden" style={{ height: bar.h }}>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600 to-blue-400 h-full transform transition-transform duration-1000 origin-bottom" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">{bar.m}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Clock className="text-blue-600" />
                        Aktivitas Terakhir
                    </h2>
                    <div className="space-y-6">
                        {[
                            { icon: <FileDigit size={20} />, title: "Sertifikat baru dibuat", time: "2 jam yang lalu", color: "bg-blue-100 text-blue-600" },
                            { icon: <CheckCircle2 size={20} />, title: "Sertifikat disetujui", time: "5 jam yang lalu", color: "bg-green-100 text-green-600" },
                            { icon: <FileText size={20} />, title: "Draft sertifikat disimpan", time: "1 hari yang lalu", color: "bg-purple-100 text-purple-600" },
                            { icon: <Users size={20} />, title: "User baru ditambahkan", time: "2 hari yang lalu", color: "bg-orange-100 text-orange-600" }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-all">
                                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.title}</div>
                                    <div className="text-xs text-gray-500">{item.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Aksi Cepat</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                        let role = 'SIGNER';
                        if (typeof window !== 'undefined') {
                            const u = localStorage.getItem('user');
                            if (u) role = JSON.parse(u).role;
                        }

                        return (
                            <>
                                {role === 'SUPERADMIN' && (
                                    <button onClick={() => window.location.href = '/dashboard/upload'} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-md hover:-translate-y-1">
                                        <FileUp size={32} />
                                        <span className="font-semibold">Upload Sertifikat</span>
                                    </button>
                                )}
                                <button onClick={() => window.location.href = '/verify'} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-md hover:-translate-y-1">
                                    <QrCode size={32} />
                                    <span className="font-semibold">Scan Sertifikat</span>
                                </button>
                                <button onClick={() => window.location.href = '/dashboard/certificates'} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all shadow-md hover:-translate-y-1">
                                    <FileText size={32} />
                                    <span className="font-semibold">Data Sertifikat</span>
                                </button>
                                {role === 'SUPERADMIN' && (
                                    <button onClick={() => window.location.href = '/dashboard/users'} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md hover:-translate-y-1">
                                        <Users size={32} />
                                        <span className="font-semibold">Kelola Pengguna</span>
                                    </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
