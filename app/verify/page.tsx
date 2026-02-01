'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifySignature, createSignableData } from '@/lib/crypto';
import { CheckCircle, XCircle, Shield, User, Calendar, Award, Info, RefreshCw, Smartphone, Search, QrCode } from 'lucide-react';
import Link from 'next/link';

type VerifyMode = 'qr' | 'id';

export default function VerifyPage() {
    const [mode, setMode] = useState<VerifyMode>('qr');
    const [certId, setCertId] = useState('');
    const [scanResult, setScanResult] = useState<any>(null);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Support direct verification from URL query parameter
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const autoData = urlParams.get('data');
            if (autoData && verificationStatus === 'idle') {
                try {
                    // Decode base64
                    const decodedJson = decodeURIComponent(escape(atob(autoData)));
                    const parsedData = JSON.parse(decodedJson);
                    if (parsedData.d && parsedData.sig && parsedData.pk && parsedData.a) {
                        setScanResult(parsedData);
                        verifyCrypto(parsedData);
                    }
                } catch (e) {
                    console.error("Failed to parse auto-verify data", e);
                    setError("Data verifikasi otomatis tidak valid.");
                }
            }
        }

        let scanner: Html5QrcodeScanner | null = null;

        if (mode === 'qr' && typeof window !== 'undefined' && !scanResult) {
            // Check if element exists before initializing
            const readerElement = document.getElementById("reader");
            if (readerElement) {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        supportedScanTypes: [0] // 0 = CAMERA ONLY
                    },
                    /* verbose= */ false
                );

                scanner.render(onScanSuccess, onScanFailure);
            }

            function onScanSuccess(decodedText: string) {
                try {
                    // Check if it's a URL or raw JSON
                    let rawJson = decodedText;
                    if (decodedText.includes('?data=')) {
                        const base64 = decodedText.split('?data=')[1];
                        rawJson = decodeURIComponent(escape(atob(base64)));
                    }

                    const data = JSON.parse(rawJson);
                    if (data.d && data.sig && data.pk && data.a) {
                        setScanResult(data);
                        verifyCrypto(data);
                        if (scanner) scanner.clear().catch(console.error);
                    } else {
                        setError("Format QR Code tidak valid.");
                    }
                } catch (e) {
                    setError("Gagal membaca data QR code.");
                }
            }

            function onScanFailure(error: any) {
                // silent failure
            }
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => {
                    // Ignore errors if element is already gone
                });
            }
        };
    }, [mode, scanResult]);

    const verifyCrypto = async (data: any) => {
        setVerificationStatus('verifying');
        try {
            const signableData = createSignableData({
                holderName: data.d.o,
                eventName: data.d.e,
                issueDate: data.d.t,
                signerName: data.d.s,
                signerPosition: data.d.p,
                timestamp: data.d.ts
            });

            const isValid = verifySignature(signableData, data.sig, data.pk, data.a);
            setVerificationStatus(isValid ? 'valid' : 'invalid');
        } catch (e) {
            console.error(e);
            setVerificationStatus('invalid');
        }
    };

    const verifyById = async () => {
        if (!certId.trim()) return;
        setVerificationStatus('verifying');
        setError(null);

        try {
            const res = await fetch(`/api/certificates/${certId}`);
            if (!res.ok) {
                throw new Error("Sertifikat tidak ditemukan.");
            }
            const data = await res.json();

            // Format to match scanResult structure for consistent UI
            const signers = data.approvals && data.approvals.length > 0
                ? data.approvals.map((a: any) => ({ name: a.user.name, position: a.user.position }))
                : [{ name: data.signerName, position: data.signerPosition }];

            setScanResult({
                d: {
                    o: data.ownerName,
                    e: data.eventName,
                    s: data.signerName, // Keep for fallback
                    p: data.signerPosition,
                    t: data.issueDate,
                    ts: data.createdAt,
                    signers: signers
                },
                a: data.algorithm || 'Unknown',
                pk: data.publicKey,
                isDbVerify: true
            });

            setVerificationStatus('valid');
        } catch (e: any) {
            setError(e.message);
            setVerificationStatus('invalid');
        }
    };

    const resetScanner = () => {
        setVerificationStatus('idle');
        setScanResult(null);
        setError(null);
        setCertId('');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
            {/* ... (Existing Header and Tabs) ... */}
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* ... Header ... */}
                <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-indigo-500 rounded-full opacity-20 transform scale-150"></div>
                    <div className="absolute bottom-0 left-0 -m-8 w-24 h-24 bg-indigo-700 rounded-full opacity-30 transform scale-125"></div>

                    <Shield className="mx-auto mb-3 h-12 w-12 text-indigo-100 drop-shadow-lg" />
                    <h1 className="text-2xl font-black tracking-tight mb-1 uppercase">Verifikasi Sertifikat</h1>
                    <p className="text-indigo-100 text-sm font-medium opacity-90">Pemindaian Aman & Validasi Database</p>
                </div>

                {/* Tabs */}
                {verificationStatus === 'idle' && (
                    <div className="flex p-1 bg-slate-100 mx-8 mt-6 rounded-2xl">
                        <button
                            onClick={() => setMode('qr')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'qr' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <QrCode size={16} />
                            Scan QR
                        </button>
                        <button
                            onClick={() => setMode('id')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'id' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Search size={16} />
                            Input ID
                        </button>
                    </div>
                )}


                <div className="p-8">
                    {/* ... (Scanner and Input logic same as before) ... */}
                    {verificationStatus === 'idle' && (
                        <div className="flex flex-col items-center">
                            {mode === 'qr' && (
                                <div key="qr-container" className="w-full">
                                    <div id="reader" className="w-full h-auto rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-inner"></div>
                                    <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700 border border-blue-100">
                                        <Info className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-xs font-semibold leading-tight">Arahkan kamera ke QR Code yang ada pada sertifikat digital Anda.</p>
                                    </div>
                                </div>
                            )}

                            {mode === 'id' && (
                                <div key="id-container" className="w-full space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number / ID Sertifikat</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={certId}
                                                onChange={(e) => setCertId(e.target.value)}
                                                placeholder="Contoh: 550e8400-e29b..."
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-mono text-sm pr-12"
                                            />
                                            <button
                                                onClick={verifyById}
                                                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-xl transition-colors"
                                            >
                                                <Search size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium text-center">Masukkan kode unik sertifikat yang tertera di bagian bawah dokumen.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {verificationStatus === 'verifying' && (
                        <div className="flex flex-col items-center py-12">
                            <RefreshCw className="h-16 w-16 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-600 font-bold text-lg">Memproses verifikasi...</p>
                        </div>
                    )}

                    {(verificationStatus === 'valid' || verificationStatus === 'invalid') && scanResult && (
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className={`p-6 rounded-3xl flex items-center gap-4 border-2 ${verificationStatus === 'valid'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}>
                                {verificationStatus === 'valid' ? (
                                    <CheckCircle className="h-12 w-12 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-12 w-12 text-rose-500" />
                                )}
                                <div>
                                    <h2 className="text-xl font-black">{verificationStatus === 'valid' ? 'VALID' : 'TIDAK VALID'}</h2>
                                    <p className="text-xs font-bold opacity-80">
                                        {verificationStatus === 'valid'
                                            ? (scanResult.isDbVerify ? 'Sertifikat terdaftar resmi di sistem kami.' : 'Sertifikat asli dan terverifikasi kriptografis.')
                                            : 'Sertifikat tidak ditemukan atau data telah dimodifikasi.'}
                                    </p>
                                </div>
                            </div>

                            {/* Details only if valid or result is present */}
                            {scanResult.d.o && (
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-slate-400 mt-1" />
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemilik Sertifikat</label>
                                            <p className="font-bold text-slate-800 text-lg uppercase leading-tight">{scanResult.d.o}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Award className="h-5 w-5 text-slate-400 mt-1" />
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Event / Kegiatan</label>
                                            <p className="font-bold text-slate-700 leading-snug">{scanResult.d.e}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-slate-400 mt-1" />
                                        <div className="w-full">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Penandatangan</label>
                                            {scanResult.d.signers ? (
                                                <div className="space-y-2 mt-1">
                                                    {scanResult.d.signers.map((signer: any, idx: number) => (
                                                        <div key={idx} className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <p className="font-bold text-slate-700 leading-tight">{signer.name}</p>
                                                            <p className="text-xs text-slate-500 font-semibold">{signer.position}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-slate-700 leading-tight">{scanResult.d.s}</p>
                                                    <p className="text-xs text-slate-500 font-semibold">{scanResult.d.p}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 border-t pt-4 border-slate-200">
                                        <Calendar className="h-5 w-5 text-slate-400 mt-1" />
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Terbit</label>
                                            <p className="font-bold text-slate-700 leading-tight">
                                                {new Date(scanResult.d.t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 border-t pt-4 border-slate-200">
                                        <Info className="h-5 w-5 text-slate-400 mt-1" />
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Verifikasi</label>
                                            <p className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black mt-1 uppercase tracking-tight">
                                                {scanResult.isDbVerify ? 'DATABASE CHECK' : (`CRYPTO: ${scanResult.a}`)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={resetScanner}
                                className="w-full py-4 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                            >
                                <RefreshCw size={18} />
                                {mode === 'qr' ? 'Scan Ulang' : 'Cek ID Lain'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-xs font-bold">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto font-black text-xs uppercase underline text-rose-900">Tutup</button>
                        </div>
                    )}
                </div>
            </div>

            <Link href="/" className="mt-8 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest border-b border-transparent hover:border-indigo-600 pb-1">
                Kembali ke Dashboard Admin
            </Link>
        </div>
    );
}
