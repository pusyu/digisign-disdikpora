import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { CertificateMetadata } from '@/types';
import { LogOut, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ALGORITHM_OPTIONS, signData, generateKeyPair, createSignableData, generateQRValue } from '@/lib/crypto';

interface SidebarProps {
    metadata: CertificateMetadata;
    setMetadata: (metadata: CertificateMetadata) => void;
    onAddQR: (canvas: HTMLCanvasElement) => void;
    availableSigners: any[];
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ metadata, setMetadata, onAddQR, availableSigners, isOpen, onToggle }: SidebarProps) {
    const router = useRouter();
    const [keyPair, setKeyPair] = useState<any>(null);

    useEffect(() => {
        // Initialize or load key pair
        const storedKeys = localStorage.getItem('pdf_editor_keys');
        if (storedKeys) {
            setKeyPair(JSON.parse(storedKeys));
        } else {
            const newKeys = generateKeyPair(metadata.algorithm);
            localStorage.setItem('pdf_editor_keys', JSON.stringify(newKeys));
            setKeyPair(newKeys);
        }
    }, [metadata.algorithm]);

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMetadata({ ...metadata, [name]: value });
    };

    const handleGenerateQR = () => {
        const qrCanvas = document.getElementById('qr-gen-canvas') as HTMLCanvasElement;
        if (qrCanvas) {
            onAddQR(qrCanvas);
        }
    };

    // Use stable timestamp from metadata
    const currentTimestamp = metadata.timestamp || new Date().toISOString();

    // Calculate QR value with signature as a URL
    let qrValue = '';
    if (keyPair && typeof window !== 'undefined') {
        const origin = window.location.origin;
        qrValue = generateQRValue(metadata, keyPair, origin);
    }

    return (
        <>
            <button
                onClick={onToggle}
                className={`fixed top-24 z-40 bg-white border border-gray-200 p-2 shadow-md hover:bg-gray-50 text-gray-600 transition-all duration-300 rounded-l-lg border-r-0 ${isOpen ? 'right-80' : 'right-0'}`}
                title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
                {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <aside className={`w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto h-screen fixed right-0 top-0 z-30 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Certificate Meta</h2>

                <div className="space-y-4 flex-grow">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Owner Name</label>
                        <input
                            type="text"
                            name="ownerName"
                            value={metadata.ownerName}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Owner Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Event Name</label>
                        <input
                            type="text"
                            name="eventName"
                            value={metadata.eventName}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Event Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Issue Date</label>
                        <input
                            type="date"
                            name="issueDate"
                            value={metadata.issueDate}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-4 rounded-xl border-2 border-blue-100 bg-blue-50/30 p-4 shadow-inner">
                        <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Users size={16} />
                            Konfigurasi Penandatangan
                        </label>

                        <div className="flex bg-white p-1 rounded-lg border border-blue-200">
                            {[1, 2].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => {
                                        const currentSigners = metadata.signers || [];
                                        if (num === 1) {
                                            setMetadata({ ...metadata, signers: currentSigners.slice(0, 1) });
                                        } else if (currentSigners.length < 2) {
                                            const nextSigners = [...currentSigners];
                                            if (nextSigners.length === 0) nextSigners.push("");
                                            nextSigners.push("");
                                            setMetadata({ ...metadata, signers: nextSigners });
                                        }
                                    }}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${(metadata.signers?.length || 1) === num
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {num} Penandatangan
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {/* Dropdown 1 */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Penandatangan Utama</label>
                                <select
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none transition-all text-sm font-medium"
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const signer = availableSigners.find(s => s.id === selectedId);
                                        if (signer) {
                                            const newSigners = [...(metadata.signers || [])];
                                            newSigners[0] = selectedId;
                                            setMetadata({
                                                ...metadata,
                                                signerName: signer.name,
                                                signerPosition: signer.position,
                                                signers: newSigners
                                            });
                                        }
                                    }}
                                    value={availableSigners.find(s => s.name === metadata.signerName && s.position === metadata.signerPosition)?.id || metadata.signers?.[0] || ""}
                                >
                                    <option value="">-- Pilih Penandatangan 1 --</option>
                                    {availableSigners.map(signer => (
                                        <option key={signer.id} value={signer.id}>
                                            {signer.name} ({signer.position})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dropdown 2 */}
                            {(metadata.signers?.length || 1) > 1 && (
                                <div className="space-y-1 animate-in zoom-in-95 duration-200">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Penandatangan Kedua</label>
                                    <select
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none transition-all text-sm font-medium"
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const newSigners = [...(metadata.signers || [])];
                                            newSigners[1] = selectedId;
                                            setMetadata({ ...metadata, signers: newSigners });
                                        }}
                                        value={metadata.signers?.[1] || ""}
                                    >
                                        <option value="">-- Pilih Penandatangan 2 --</option>
                                        {availableSigners.filter(s => s.id !== metadata.signers?.[0]).map(signer => (
                                            <option key={signer.id} value={signer.id}>
                                                {signer.name} ({signer.position})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Signature Algorithm</label>
                        <select
                            name="algorithm"
                            value={metadata.algorithm}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                        >
                            {ALGORITHM_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-6 border-t mt-6">
                        <label className="block text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">QR Preview</label>
                        <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            {qrValue && (
                                <QRCodeCanvas
                                    id="qr-gen-canvas"
                                    value={qrValue}
                                    size={160}
                                    level="L" // Lower level to fit more data if needed
                                    includeMargin={true}
                                />
                            )}
                            <button
                                onClick={handleGenerateQR}
                                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add to PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
