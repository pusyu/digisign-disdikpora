'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileUp,
    QrCode,
    Database,
    Users,
    FileText,
    UserCircle,
    LogOut,
    ChevronDown,
    ChevronRight,
    Search,
    Menu,
    X,
    BarChart3
} from 'lucide-react';
import Image from 'next/image';
import logoImg from '@/public/logo.png';

export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMasterDataOpen, setIsMasterDataOpen] = useState(pathname.includes('/dashboard/users') || pathname.includes('/dashboard/certificates') || pathname.includes('/dashboard/profile'));
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                // Also fetch from API to get the image
                try {
                    const res = await fetch('/api/profile');
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data);
                    }
                } catch (e) { }
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('user');
            router.push('/login');
            router.refresh();
        }
    };

    const isAdmin = user?.role === 'SUPERADMIN';

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-[280px]'} bg-white border-r-2 border-gray-200 flex flex-col h-screen sticky top-0 transition-all duration-300 z-50`}>
            {/* Brand */}
            <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-bottom border-gray-200 bg-gradient-to-br from-gray-50 to-white relative`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
                    <div className="w-10 h-10 flex items-center justify-center relative overflow-hidden">
                        <Image
                            src={logoImg}
                            alt="Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="text-lg font-bold text-gray-800 leading-tight">Digisign</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Disdikpora Kabupaten Lingga</div>
                    </div>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ${isCollapsed ? '' : ''}`}
                >
                    {isCollapsed ? <Menu size={24} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Profile */}
            <div className={`px-4 py-6 border-b-2 border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                <div className="relative group flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl border-2 border-blue-500 overflow-hidden flex items-center justify-center bg-blue-50 shadow-sm group-hover:shadow-md transition-all">
                        {user?.image ? (
                            <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-black text-blue-500">{user?.name?.[0] || 'U'}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
                        <div className="text-sm font-bold text-gray-800 truncate" title={user?.name || user?.username}>{user?.name || user?.username || 'User'}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user?.role || 'Signer'}</div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
                <div className="px-2 space-y-1">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${pathname === '/dashboard' ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-blue-600'} ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Dashboard" : ""}
                    >
                        <LayoutDashboard size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>Dashboard</span>}
                    </Link>

                    {isAdmin && (
                        <Link
                            href="/dashboard/upload"
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${pathname === '/dashboard/upload' ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-blue-600'} ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? "Upload Sertifikat" : ""}
                        >
                            <FileUp size={20} className="flex-shrink-0" />
                            {!isCollapsed && <span>Upload Sertifikat</span>}
                        </Link>
                    )}

                    <Link
                        href="/verify"
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${pathname === '/verify' ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-blue-600'} ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Scan Sertifikat" : ""}
                    >
                        <QrCode size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>Scan Sertifikat</span>}
                    </Link>

                    <Link
                        href="/analisis"
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${pathname === '/analisis' ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-blue-600'} ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Analisis" : ""}
                    >
                        <BarChart3 size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>Analisis</span>}
                    </Link>

                    {/* Master Data Submenu */}
                    <div>
                        <button
                            onClick={() => !isCollapsed && setIsMasterDataOpen(!isMasterDataOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all ${pathname.includes('/dashboard/users') || pathname.includes('/dashboard/certificates') || pathname.includes('/dashboard/profile') ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? "Master Data" : ""}
                        >
                            <div className="flex items-center gap-3">
                                <Database size={20} className="flex-shrink-0" />
                                {!isCollapsed && <span>Master Data</span>}
                            </div>
                            {!isCollapsed && (isMasterDataOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </button>

                        {(isMasterDataOpen || isCollapsed) && (
                            <div className={`mt-1 bg-gray-50 rounded-lg overflow-hidden ${isCollapsed ? 'hidden group-hover:block absolute left-20 bg-white shadow-xl border p-2 w-48 z-50' : ''}`}>
                                {isAdmin && (
                                    <Link
                                        href="/dashboard/users"
                                        className={`flex items-center gap-3 ${isCollapsed ? 'p-2' : 'pl-10 pr-4 py-2'} transition-all text-sm ${pathname === '/dashboard/users' ? 'text-blue-600 font-semibold bg-blue-100' : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600'}`}
                                    >
                                        {isCollapsed && <Users size={16} />}
                                        <span className={isCollapsed ? '' : ''}>{isCollapsed ? "Data Penandatangan" : "Data Penandatangan"}</span>
                                    </Link>
                                )}
                                <Link
                                    href="/dashboard/certificates"
                                    className={`flex items-center gap-3 ${isCollapsed ? 'p-2' : 'pl-10 pr-4 py-2'} transition-all text-sm ${pathname === '/dashboard/certificates' ? 'text-blue-600 font-semibold bg-blue-100' : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600'}`}
                                >
                                    {isCollapsed && <FileText size={16} />}
                                    <span>Data Sertifikat</span>
                                </Link>
                                <Link
                                    href="/dashboard/profile"
                                    className={`flex items-center gap-3 ${isCollapsed ? 'p-2' : 'pl-10 pr-4 py-2'} transition-all text-sm ${pathname === '/dashboard/profile' ? 'text-blue-600 font-semibold bg-blue-100' : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600'}`}
                                >
                                    {isCollapsed && <UserCircle size={16} />}
                                    <span>Data Profil</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t-2 border-gray-200">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all font-semibold ${isCollapsed ? 'justify-center' : ''}`}
                    title="Logout"
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
