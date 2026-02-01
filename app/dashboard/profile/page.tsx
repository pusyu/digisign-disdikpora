'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Camera, Save, Loader2, CheckCircle2, Shield, Briefcase, UserCircle } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        position: '',
        image: '',
        password: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData({
                    username: data.username || '',
                    name: data.name || '',
                    position: data.position || '',
                    image: data.image || '',
                    password: ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccess(false);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                // Update localStorage if necessary
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    localStorage.setItem('user', JSON.stringify({
                        ...parsed,
                        username: updatedUser.username,
                        name: updatedUser.name
                    }));
                }
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Update failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-gray-500 font-medium">Memuat profil Anda...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10">
                    <UserCircle size={200} />
                </div>
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Profile Image with Upload Trigger */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-500">
                            {formData.image ? (
                                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={60} className="text-white/80" />
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 bg-white text-blue-600 p-2.5 rounded-2xl shadow-lg hover:bg-blue-50 transition-colors transform hover:scale-110 active:scale-95 duration-300"
                        >
                            <Camera size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black">{user?.name || user?.username}</h1>
                        <p className="text-blue-100 font-medium mt-1 flex items-center justify-center md:justify-start gap-2 italic">
                            <Briefcase size={16} />
                            {user?.position || 'Jabatan belum diatur'}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                                {user?.role}
                            </span>
                            <span className="bg-emerald-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-400/30 text-emerald-100">
                                Terverifikasi
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <h2 className="col-span-1 md:col-span-2 text-xl font-bold text-gray-800 mb-2 border-b-2 border-blue-50 pb-2 flex items-center gap-2">
                    <Shield className="text-blue-500" size={24} />
                    Informasi Akun
                </h2>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 ml-1">Username</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                            required
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 ml-1">Username digunakan untuk login ke sistem.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 ml-1">Nama Lengkap</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 ml-1">Jabatan / Posisi</label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 ml-1">Password Baru (Opsional)</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                    <p className="text-[10px] text-gray-400 ml-1">Kosongkan jika tidak ingin mengubah password.</p>
                </div>

                <div className="col-span-1 md:col-span-2 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {success && (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full animate-in zoom-in duration-300">
                                <CheckCircle2 size={18} />
                                Profil berhasil diperbarui
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${isSaving ? 'animate-pulse' : ''}`}
                    >
                        {isSaving ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    );
}
