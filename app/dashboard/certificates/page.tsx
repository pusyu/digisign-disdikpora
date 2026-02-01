'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Download,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    UserCheck,
    Eye,
    Check
} from 'lucide-react';
import download from 'downloadjs';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/certificates');
            const data = await res.json();
            setCertificates(data);
            setSelectedIds([]); // Reset selection after fetch
        } catch (error) {
            console.error('Failed to fetch certificates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const res = await fetch(`/api/approvals/${id}/approve`, { method: 'POST' });
            if (res.ok) {
                fetchCertificates();
            } else {
                alert('Gagal menyetujui sertifikat');
            }
        } catch (error) {
            console.error('Approval failed', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus sertifikat ini?')) {
            try {
                const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchCertificates();
                } else {
                    alert('Gagal menghapus sertifikat');
                }
            } catch (error) {
                console.error('Delete failed', error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Yakin ingin menghapus ${selectedIds.length} sertifikat terpilih?`)) {
            try {
                const res = await fetch('/api/certificates/bulk-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedIds }),
                });
                if (res.ok) {
                    fetchCertificates();
                } else {
                    alert('Gagal menghapus sertifikat secara massal');
                }
            } catch (error) {
                console.error('Bulk delete failed', error);
            }
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Yakin ingin menyetujui ${selectedIds.length} sertifikat terpilih?`)) {
            try {
                const res = await fetch('/api/approvals/bulk-approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedIds }),
                });
                if (res.ok) {
                    fetchCertificates();
                } else {
                    alert('Gagal menyetujui beberapa sertifikat');
                }
            } catch (error) {
                console.error('Bulk approve failed', error);
            }
        }
    };

    const handleBatchDownload = async () => {
        // If nothing selected, download all approved
        const idsToDownload = selectedIds.length > 0 ? selectedIds : certificates.filter(c => c.status === 'APPROVED').map(c => c.id);

        if (idsToDownload.length === 0) {
            alert('Tidak ada sertifikat yang dipilih atau yang sudah disetujui.');
            return;
        }

        try {
            // Download files one by one
            for (let i = 0; i < idsToDownload.length; i++) {
                const cert = certificates.find(c => c.id === idsToDownload[i]);
                if (!cert) continue;

                const fileUrl = cert.pdfUrl || `/uploads/certificates/${cert.id}.pdf`;
                const res = await fetch(fileUrl);
                if (res.ok) {
                    const blob = await res.blob();
                    download(blob, cert.pdfName || `${cert.ownerName}.pdf`, 'application/pdf');

                    // Small delay between downloads to prevent browser blocking
                    if (i < idsToDownload.length - 1) {
                        await new Promise(r => setTimeout(r, 500));
                    }
                }
            }
            alert(`Berhasil mendownload ${idsToDownload.length} sertifikat!`);
        } catch (error) {
            console.error('Batch download failed', error);
            alert('Gagal mendownload beberapa sertifikat');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredCerts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCerts.map(c => c.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const filteredCerts = certificates.filter(cert =>
        cert.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.pdfName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari sertifikat..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <>
                            {user?.role === 'SIGNER' && (
                                <button
                                    onClick={handleBulkApprove}
                                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95 text-sm"
                                >
                                    <CheckCircle size={18} />
                                    Setujui ({selectedIds.length})
                                </button>
                            )}

                            {user?.role === 'SUPERADMIN' && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-all shadow-md active:scale-95 text-sm"
                                >
                                    <Trash2 size={18} />
                                    Hapus ({selectedIds.length})
                                </button>
                            )}

                            <button
                                onClick={handleBatchDownload}
                                className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95 text-sm"
                            >
                                <Download size={18} />
                                Download ({selectedIds.length})
                            </button>
                        </>
                    )}

                    {/* Default Batch Download Button (if nothing selected, likely downloads all approved) */}
                    {selectedIds.length === 0 && certificates.some(c => c.status === 'APPROVED') && (
                        <button
                            onClick={handleBatchDownload}
                            className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95 text-sm"
                        >
                            <Download size={18} />
                            Download Semua
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="px-4 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={filteredCerts.length > 0 && selectedIds.length === filteredCerts.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">No</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Nama Pemilik</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Penyetuju</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 animate-pulse font-medium">Memuat data...</td></tr>
                            ) : filteredCerts.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada sertifikat.</td></tr>
                            ) : (
                                filteredCerts.map((cert, index) => (
                                    <tr
                                        key={cert.id}
                                        className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(cert.id) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(cert.id)}
                                                onChange={() => toggleSelectOne(cert.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-bold text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{cert.ownerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{cert.eventName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${cert.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                cert.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {cert.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {cert.approvals.map((app: any) => (
                                                    <div key={app.id}
                                                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-help ${app.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-gray-400'
                                                            }`}
                                                        title={`${app.user.name}: ${app.status}`}
                                                    >
                                                        {app.user.name?.[0] || '?'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Preview Button for Everyone */}
                                                <button
                                                    onClick={() => window.open(cert.pdfUrl || `/uploads/certificates/${cert.id}.pdf`, '_blank')}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Lihat PDF"
                                                >
                                                    <FileText size={18} />
                                                </button>

                                                {user?.role === 'SIGNER' && cert.approvals.some((a: any) => a.userId === user.id && a.status === 'PENDING') && (
                                                    <button
                                                        onClick={() => handleApprove(cert.id)}
                                                        className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm"
                                                    >
                                                        <Check size={14} /> Setujui
                                                    </button>
                                                )}
                                                {cert.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => window.open(`/verify?id=${cert.id}`, '_blank')}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Verify"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {user?.role === 'SUPERADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(cert.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
