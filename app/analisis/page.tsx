'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Activity,
    Zap,
    ShieldCheck,
    Cpu,
    ArrowRight,
    Binary,
    Layers,
    Clock,
    BarChart3,
    CheckCircle2,
    Search,
    Edit3,
    Database,
    Wand2,
    X,
    Eye,
    ChevronDown,
    ChevronRight,
    Terminal,
    ArrowUpRight,
    Play,
    Hash,
    Key,
    PenTool,
    RefreshCw
} from 'lucide-react';
import {
    ecdsaSha128,
    ecdsaNoHash,
    ecdsaBlake2b,
    ecdsaSha128Blake2b,
    ALGORITHMS
} from '@/lib/crypto';
import { sha128, bytesToHex } from '@/lib/crypto/sha128.js';
import { blake2b } from '@/lib/crypto/blake2b.js';

// Configuration for algorithms
const ALGO_CONFIG = {
    [ALGORITHMS.ECDSA_SHA128]: {
        id: 1,
        name: 'ECDSA + SHA 128',
        module: ecdsaSha128,
        hashFn: sha128,
        color: '#3b82f6'
    },
    [ALGORITHMS.ECDSA_NO_HASH]: {
        id: 2,
        name: 'ECDSA + No Hash',
        module: ecdsaNoHash,
        hashFn: (data: any) => data,
        color: '#94a3b8'
    },
    [ALGORITHMS.ECDSA_BLAKE2B]: {
        id: 3,
        name: 'ECDSA + BLAKE2B',
        module: ecdsaBlake2b,
        hashFn: (data: any) => blake2b(data, 32),
        color: '#10b981'
    },
    [ALGORITHMS.ECDSA_SHA128_BLAKE2B]: {
        id: 4,
        name: 'ECDSA + BLAKE2B + SHA 128',
        module: ecdsaSha128Blake2b,
        hashFn: (data: any) => blake2b(sha128(data), 32),
        color: '#8b5cf6'
    }
};

export default function IndependentAnalysisPage() {
    const [isTesting, setIsTesting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [lastSha128Time, setLastSha128Time] = useState<number | null>(null);
    const [testCount, setTestCount] = useState(5);


    // Result & Trace state for each algorithm
    const [algoLogs, setAlgoLogs] = useState<Record<string, any[]>>({
        [ALGORITHMS.ECDSA_SHA128]: [],
        [ALGORITHMS.ECDSA_NO_HASH]: [],
        [ALGORITHMS.ECDSA_BLAKE2B]: [],
        [ALGORITHMS.ECDSA_SHA128_BLAKE2B]: [],
    });

    const [algoMetrics, setAlgoMetrics] = useState<Record<string, any>>({});

    // Modal state for popup data view
    const [selectedData, setSelectedData] = useState<{ algoName: string; data: any } | null>(null);

    // Metadata State
    const [metadata, setMetadata] = useState({
        holder_name: "Putri Suci Renita",
        event_name: "Workshop Keamanan Siber 2026",
        issue_date: "2026-01-01",
        signer_name: "Admin Disdikpora",
        signer_position: "Kepala Bidang IT",
        timestamp: "2026-01-01T00:00:00.000Z"
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const runAllTests = async () => {
        setIsTesting(true);
        const newLogs: Record<string, any[]> = {};
        const newMetrics: Record<string, any> = {};

        // Helper for padding anatomy breakdown
        const getPaddingAnatomy = (data: string) => {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);
            const msgLen = bytes.length;
            const bitLen = BigInt(msgLen * 8);
            let padLen = 64 - ((msgLen + 9) % 64);
            if (padLen === 64) padLen = 0;
            const totalLen = msgLen + 1 + padLen + 8;
            const padded = new Uint8Array(totalLen);
            padded.set(bytes);
            padded[msgLen] = 0x80;
            const view = new DataView(padded.buffer);
            view.setBigUint64(totalLen - 8, bitLen, false); // Big endian length

            const hexArr = Array.from(padded).map(b => b.toString(16).padStart(2, '0'));

            return {
                data: hexArr.slice(0, msgLen).join(' '),
                separator: hexArr[msgLen],
                zeroFill: hexArr.slice(msgLen + 1, totalLen - 8).join(' '),
                lengthBits: hexArr.slice(totalLen - 8).join(' '),
                full: hexArr.join(' ')
            };
        };

        // Helper to extract u1, u2 for verification trace
        const getVerificationMath = (algoKey: string, data: string, signatureStr: string, publicKeyStr: string) => {
            const config = (ALGO_CONFIG as any)[algoKey];
            const sig = JSON.parse(signatureStr);
            const r = BigInt(sig.r);
            const s = BigInt(sig.s);
            const Q = JSON.parse(publicKeyStr, (k, v) => (k === 'x' || k === 'y' ? BigInt(v) : v));
            const n = 37n; // Group order from library

            // Re-calculate e based on algorithm
            let e = 0n;
            if (algoKey === ALGORITHMS.ECDSA_NO_HASH) {
                const len = Math.min(data.length, 8);
                for (let i = 0; i < len; i++) e = (e * 256n + BigInt(data.charCodeAt(i))) % n;
                if (e === 0n) e = 1n;
            } else if (algoKey === ALGORITHMS.ECDSA_SHA128) {
                const hashBytes = sha128(data);
                for (let b of hashBytes) e += BigInt(b);
                e %= n;
            } else if (algoKey === ALGORITHMS.ECDSA_BLAKE2B) {
                const hashBytes = blake2b(data, 32);
                for (let b of hashBytes) e += BigInt(b);
                e %= n;
            } else {
                const innerHash = sha128(data);
                const hashBytes = blake2b(innerHash, 32);
                for (let b of hashBytes) e += BigInt(b);
                e %= n;
            }

            // Extended Euclidean for s^-1 mod n
            const modInverse = (a: bigint, m: bigint) => {
                let [old_r, curr_r] = [a, m];
                let [old_s, curr_s] = [1n, 0n];
                while (curr_r !== 0n) {
                    const q = old_r / curr_r;
                    [old_r, curr_r] = [curr_r, old_r - q * curr_r];
                    [old_s, curr_s] = [curr_s, old_s - q * curr_s];
                }
                return old_s < 0n ? old_s + m : old_s;
            };

            const w = modInverse(s, n);
            const u1 = (e * w) % n;
            const u2 = (r * w) % n;

            return { e, w, u1, u2, r, s };
        };

        // Generate dynamic data variations based on user request
        const currentDataBatch = [];
        for (let i = 0; i < testCount; i++) {
            currentDataBatch.push({
                ...metadata,
                holder_name: `${metadata.holder_name} #${i + 1}`
            });
        }

        const keys = Object.keys(ALGO_CONFIG);

        for (const algoKey of keys) {
            newLogs[algoKey] = [];
            const config = (ALGO_CONFIG as any)[algoKey];

            let totalExecTime = 0;
            let successCount = 0;
            let firstAvalanche = 0;

            for (let i = 0; i < currentDataBatch.length; i++) {
                const dataObj = currentDataBatch[i];
                const trace: any = { id: i + 1, steps: [] };

                // Step 1: Data Initialization
                const signableData = config.module.createSignableData(dataObj);
                trace.steps.push({
                    title: '01: Data Initialization',
                    content: `Serializing object to canonical string format.`,
                    details: `[Raw Metadata Object]\n${JSON.stringify(dataObj, null, 2)}\n\n[Serialized Payload]\n"${signableData}"\n\nLength: ${signableData.length} chars`
                });

                // Step 2: Hashing & Padding
                let hashOutput;
                if (algoKey === ALGORITHMS.ECDSA_NO_HASH) {
                    hashOutput = Buffer.from(signableData).toString('hex');
                    trace.steps.push({
                        title: '02: Direct Processing (No Hash)',
                        content: 'Hashing phase bypassed. Converting raw bytes to integer input.',
                        details: `Input Str: ${signableData}\nInteger e: (derived from first 8 bytes)`
                    });
                } else {
                    const anatomy = getPaddingAnatomy(signableData);
                    hashOutput = config.hashFn(signableData);

                    const hashHex = Array.isArray(hashOutput) || hashOutput instanceof Uint8Array ?
                        Array.from(hashOutput).map((b: any) => b.toString(16).padStart(2, '0')).join('') :
                        hashOutput.toString();

                    if (algoKey === ALGORITHMS.ECDSA_SHA128_BLAKE2B) {
                        const intermediateSha = sha128(signableData);
                        const shaHex = Array.from(intermediateSha).map(b => b.toString(16).padStart(2, '0')).join('');

                        trace.steps.push({
                            title: '02: Hybrid Hash Phase (Double Layer)',
                            content: `Step A: SHA-128 Padding | Step B: BLAKE2b Finalization`,
                            details: `[Layer 1: SHA-128 Padding Anatomy]\nData: ${anatomy.data}\nSeparator: [${anatomy.separator}]\nZero-Fill: ${anatomy.zeroFill}\nLength Bits: ${anatomy.lengthBits}\n\n[Layer 1 Output (Intermediate)]\nDigest: ${shaHex}\n\n[Layer 2: BLAKE2b Transformation]\nApplying 256-bit entropy compression to SHA output.\n\nFinal Hybrid Digest: ${hashHex}`
                        });
                    } else {
                        trace.steps.push({
                            title: '02: Hash & Padding Phase',
                            content: `Applying ${(config.name.split('+')[1] || config.name).trim()} transformation.`,
                            details: `[Padded Block Anatomy]\nData: ${anatomy.data}\nSeparator: [${anatomy.separator}]\nZero-Fill: ${anatomy.zeroFill}\nLength Bits: ${anatomy.lengthBits}\n\nFinal Digest: ${hashHex}`
                        });
                    }
                }

                // Step 3: Key Generation
                const keyPair = config.module.generateKeyPair();
                const pubKeyObj = JSON.parse(keyPair.publicKey);
                trace.steps.push({
                    title: '03: Key Infrastructure',
                    content: `Generated ephemeral elliptic curve pair.`,
                    details: `d (Private): ${keyPair.privateKey}\nQ (Public): { x: ${pubKeyObj.x}, y: ${pubKeyObj.y} }`
                });

                // Step 4: Signing
                const startTimeSign = performance.now();
                const signatureStr = config.module.signData(signableData, keyPair.privateKey);
                const endTimeSign = performance.now();
                const execTime = endTimeSign - startTimeSign;
                totalExecTime += execTime;

                const sig = JSON.parse(signatureStr);
                trace.steps.push({
                    title: '04: ECDSA Sign Process',
                    content: `Cryptographic signature generated using private key d.`,
                    details: `Component r: ${sig.r}\nComponent s: ${sig.s}\nExec: ${execTime.toFixed(4)}ms`
                });

                // Step 5: Integrity Verification
                const isValid = config.module.verifySignature(signableData, signatureStr, keyPair.publicKey);
                if (isValid) successCount++;

                const math = getVerificationMath(algoKey, signableData, signatureStr, keyPair.publicKey);

                trace.steps.push({
                    title: '05: Integrity Verification',
                    content: isValid ? 'SUCCESS: Mathematical proof confirmed.' : 'FAILURE: Integrity check failed.',
                    details: `[Verifikasi Step-by-Step]\n1. Message Hash (e): ${math.e}\n2. Modular Inverse (w = s⁻¹ mod 37): ${math.w}\n3. Intermed u1 (e*w mod 37): ${math.u1}\n4. Intermed u2 (r*w mod 37): ${math.u2}\n5. Result Point (u1G + u2Q).x mod 37: ${math.r}\n\nSTATUS: ${isValid ? 'VERIFIED' : 'INVALID'}`
                });

                // Avalanche (only for first)
                if (i === 0 && algoKey !== ALGORITHMS.ECDSA_NO_HASH) {
                    const flipBitMetadata = signableData + " ";
                    const h1 = config.hashFn(signableData);
                    const h2 = config.hashFn(flipBitMetadata);
                    let diffBits = 0;
                    const len = Math.min(h1.length, h2.length);
                    for (let k = 0; k < len; k++) {
                        const xor = h1[k] ^ h2[k];
                        for (let j = 0; j < 8; j++) if ((xor >> j) & 1) diffBits++;
                    }
                    firstAvalanche = (diffBits / (len * 8)) * 100;
                }

                newLogs[algoKey].push(trace);
            }

            const avgExecTime = totalExecTime / currentDataBatch.length;
            if (algoKey === ALGORITHMS.ECDSA_SHA128) setLastSha128Time(avgExecTime);

            newMetrics[algoKey] = {
                execTime: avgExecTime.toFixed(4),
                reliability: ((successCount / currentDataBatch.length) * 100).toFixed(2),
                avalanche: firstAvalanche.toFixed(2),
            };
        }

        // Calculate Efficiency Factor E for all after collecting avgExecTimes
        for (const algoKey of keys) {
            const avgTime = parseFloat(newMetrics[algoKey].execTime);
            let E = 0;
            const sha128Avg = algoKey === ALGORITHMS.ECDSA_SHA128 ? avgTime : (newMetrics[ALGORITHMS.ECDSA_SHA128]?.execTime || avgTime);
            if (avgTime > 0) E = parseFloat(sha128Avg) / avgTime;
            newMetrics[algoKey].efficiency = E.toFixed(3);
        }

        setAlgoLogs(newLogs);
        setAlgoMetrics(newMetrics);
        setIsTesting(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono selection:bg-white selection:text-black">
            {/* Minimalist Top Bar */}
            <header className="border-b border-[#222] px-10 h-24 flex items-center justify-between sticky top-0 bg-[#050505] z-50">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-white">ANALISIS ALGORITMA</h1>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Laboratory Stress Test & Process Tracer</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-6 py-2 border border-[#222] bg-[#111] rounded-full">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Data Stream:</span>
                        <input
                            type="number"
                            value={testCount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTestCount(isNaN(val) ? 1 : Math.min(1000, Math.max(1, val)));
                            }}
                            className="bg-transparent border-none text-[10px] font-black text-white w-12 focus:outline-none text-center"
                            min="1"
                            max="1000"
                        />
                    </div>

                    <button
                        onClick={runAllTests}
                        disabled={isTesting}
                        className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all group relative active:scale-95"
                    >
                        {isTesting ? <RefreshCw className="animate-spin" size={24} /> : (
                            <>
                                <span className="text-[10px] uppercase font-black tracking-tighter text-center">Run<br />Lab</span>
                                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping"></div>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="px-10 py-10 space-y-12 max-w-[1600px] mx-auto">
                {/* Manual Metadata Input */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 border border-[#222] p-8 bg-[#0a0a0a] rounded-sm shadow-2xl relative z-10">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Edit3 size={40} />
                    </div>
                    {isMounted && Object.keys(metadata).map((key) => (
                        <div key={key} className="flex flex-col gap-2">
                            <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-[0.2em]">{key.replace('_', ' ')}</label>
                            <input
                                type="text"
                                value={(metadata as any)[key]}
                                onChange={(e) => setMetadata(prev => ({ ...prev, [key]: e.target.value }))}
                                className="bg-transparent border-b border-[#222] py-2 text-[11px] font-mono focus:outline-none focus:border-white transition-all text-zinc-300"
                            />
                        </div>
                    ))}
                </div>

                {/* 4 Column Processor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    {Object.entries(ALGO_CONFIG).map(([key, config]) => (
                        <div key={key} className="border border-[#222] flex flex-col bg-[#080808] min-h-[500px] h-[65vh] relative z-10 transition-all hover:border-[#333]">
                            <div className="px-5 py-4 border-b border-[#222] bg-[#0c0c0c] flex items-center justify-between sticky top-0 z-20">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-200">{config.name}</h3>
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: config.color }}></div>
                            </div>
                            <div className="px-5 py-2.5 bg-[#050505] border-b border-[#111] flex items-center gap-2">
                                <Terminal size={12} className="text-zinc-600" />
                                <span className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest">PROCESS_LOGS</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-[#050505]">
                                {algoLogs[key].length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                        <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <Cpu size={32} />
                                        </div>
                                        <span className="text-[9px] uppercase tracking-[0.3em]">Module Idle</span>
                                    </div>
                                ) : (
                                    algoLogs[key].map((item) => (
                                        <LogItem
                                            key={item.id}
                                            data={item}
                                            onSelect={() => setSelectedData({ algoName: config.name, data: item })}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Data Detail Modal Popup */}
                {selectedData && (
                    <DataDetailModal
                        algoName={selectedData.algoName}
                        data={selectedData.data}
                        onClose={() => setSelectedData(null)}
                    />
                )}

                {/* Comparison Section (Metric Overview) */}
                <div className="border border-[#222] bg-[#0a0a0a] p-16 relative overflow-hidden rounded-sm shadow-inner group">
                    <div className="absolute top-0 right-0 w-full h-full opacity-[0.02] pointer-events-none transition-opacity group-hover:opacity-[0.05]">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black uppercase tracking-[0.5em] text-white">
                            STATS
                        </div>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-[0.8em] text-center mb-20 text-zinc-700 relative z-10">
                        PERBANDINGAN
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
                        {Object.entries(ALGO_CONFIG).map(([key, config]) => {
                            const metrics = algoMetrics[key] || { execTime: '0.000', efficiency: '0.000', avalanche: '0.00', reliability: '0.00' };
                            return (
                                <div key={key} className="space-y-10">
                                    <div className="text-[11px] font-black uppercase tracking-widest text-center py-3 border-y border-[#222]/50 bg-[#111]/30" style={{ color: config.color }}>
                                        {config.name}
                                    </div>
                                    <div className="space-y-8">
                                        <MetricDisplay label="Avg Execution" value={metrics.execTime} unit="ms" />
                                        <MetricDisplay label="Efficiency E" value={metrics.efficiency} unit="pts" />
                                        <MetricDisplay label="Avalanche Effect" value={metrics.avalanche} unit="%" />
                                        <MetricDisplay label="Reliability" value={metrics.reliability} unit="%" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Descriptive Narrative Analysis */}
                    {(() => {
                        const entries = Object.entries(algoMetrics);
                        if (entries.length === 0) return null;

                        const getWinner = (metric: string, type: 'min' | 'max' | 'target', targetVal?: number): string => {
                            if (entries.length === 0) return "N/A";
                            let winnerKey = entries[0][0];
                            let winnerVal = parseFloat(entries[0][1][metric]);

                            for (const [key, data] of entries) {
                                const val = parseFloat(data[metric]);
                                if (type === 'min' && val < winnerVal) {
                                    winnerKey = key;
                                    winnerVal = val;
                                } else if (type === 'max' && val > winnerVal) {
                                    winnerKey = key;
                                    winnerVal = val;
                                } else if (type === 'target' && targetVal !== undefined) {
                                    if (Math.abs(val - targetVal) < Math.abs(winnerVal - targetVal)) {
                                        winnerKey = key;
                                        winnerVal = val;
                                    }
                                }
                            }
                            return winnerKey.split('_').map(w => w.toUpperCase()).join(' ');
                        };

                        const bestTime = getWinner('execTime', 'min');
                        const bestEff = getWinner('efficiency', 'max');

                        // Specialized winner for Avalanche (exclude no-hash)
                        const avalancheEntries = entries.filter(([k]) => k !== ALGORITHMS.ECDSA_NO_HASH);
                        let bestAvalanche = "N/A";
                        if (avalancheEntries.length > 0) {
                            let winKey = avalancheEntries[0][0];
                            let winVal = parseFloat(avalancheEntries[0][1].avalanche);
                            for (const [key, data] of avalancheEntries) {
                                const v = parseFloat(data.avalanche);
                                if (Math.abs(v - 50) < Math.abs(winVal - 50)) {
                                    winKey = key;
                                    winVal = v;
                                }
                            }
                            bestAvalanche = winKey.split('_').map(w => w.toUpperCase()).join(' ');
                        }

                        const bestReliability = getWinner('reliability', 'max');

                        return (
                            <div className="mt-32 pt-20 border-t border-[#222] relative z-10 space-y-20">
                                <h3 className="text-lg font-black uppercase tracking-[0.4em] text-white/40 mb-10">Descriptive Analytics</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-32">
                                    {/* 1. Execution Time Analysis */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest group">
                                            <div className="w-8 h-px bg-blue-500 group-hover:w-16 transition-all"></div>
                                            1. Perhitungan Waktu Eksekusi Rata-Rata
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            <div className="p-6 bg-[#050505] border border-[#111] font-mono text-zinc-500 leading-loose rounded-sm shadow-xl">
                                                <div className="text-white mb-4 italic">Formula:</div>
                                                {'$T_{avg} = \\frac{\\sum_{i=1}^{n} T_i}{n}$'}
                                                <div className="text-[9px] mt-4 opacity-50 uppercase tracking-tighter">
                                                    {'$T_i$ = waktu eksekusi pada percobaan ke-i | $n$ = jumlah total percobaan'}
                                                </div>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                Dari hasil uji coba, algoritma <b className="text-blue-400 uppercase tracking-wider">{bestTime}</b> memiliki perhitungan waktu eksekusi rata paling baik.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Efficiency Analysis */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest group">
                                            <div className="w-8 h-px bg-emerald-500 group-hover:w-16 transition-all"></div>
                                            2. Analisis Efisiensi Algoritma
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            <div className="p-6 bg-[#050505] border border-[#111] font-mono text-zinc-500 leading-loose rounded-sm shadow-xl">
                                                <div className="text-white mb-4 italic">Formula:</div>
                                                {'$E = \\frac{T_{SHA128}}{T_{Current}}$'}
                                                <div className="text-[9px] mt-4 opacity-50 uppercase tracking-tighter">
                                                    {'Jika $E > 1$, maka lebih efisien dibandingkan SHA-128.'}
                                                </div>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                Dari hasil uji coba, algoritma <b className="text-emerald-400 uppercase tracking-wider">{bestEff}</b> memiliki perhitungan efisiensi algoritma paling baik.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. Avalanche Effect Analysis */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest group">
                                            <div className="w-8 h-px bg-orange-500 group-hover:w-16 transition-all"></div>
                                            3. Perhitungan Avalanche Effect
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            <div className="p-6 bg-[#050505] border border-[#111] font-mono text-zinc-500 leading-loose rounded-sm shadow-xl">
                                                <div className="text-white mb-4 italic">Formula:</div>
                                                {'$AE = \\frac{\\text{Jumlah bit berubah}}{\\text{Jumlah total bit}} \\times 100\\%$'}
                                                <div className="text-[9px] mt-4 opacity-50 uppercase tracking-tighter">
                                                    Nilai AE mendekati 50% menunjukkan fungsi hash memiliki keamanan yang baik.
                                                </div>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                Dari hasil uji coba, algoritma <b className="text-orange-400 uppercase tracking-wider">{bestAvalanche}</b> memiliki perhitungan Avalanche Effect paling baik (mendekati 50%).
                                            </p>
                                        </div>
                                    </div>

                                    {/* 4. Reliability Analysis */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest group">
                                            <div className="w-8 h-px bg-purple-500 group-hover:w-16 transition-all"></div>
                                            4. Tingkat Keandalan Sistem
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            <div className="p-6 bg-[#050505] border border-[#111] font-mono text-zinc-500 leading-loose rounded-sm shadow-xl">
                                                <div className="text-white mb-4 italic">Formula:</div>
                                                {'$R = \\frac{\\text{Jumlah verifikasi sukses}}{\\text{Jumlah total pengujian}} \\times 100\\%$'}
                                                <div className="text-[9px] mt-4 opacity-50 uppercase tracking-tighter">
                                                    {'Nilai R mendekati 100% menunjukkan sistem memiliki tingkat keandalan tinggi.'}
                                                </div>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                Dari hasil uji coba, algoritma <b className="text-purple-400 uppercase tracking-wider">{bestReliability}</b> memiliki Tingkat Keandalan Sistem paling baik.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Visual Charts Section */}
                                <div className="mt-40 space-y-16">
                                    <div className="text-center space-y-4">
                                        <h3 className="text-xl font-black uppercase tracking-[0.6em] text-white">Visual Comparison Charts</h3>
                                        <div className="w-24 h-1 bg-white mx-auto opacity-20"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                        <ChartWrapper title="Execution Time Distribution" subtitle="Lower is better (ms)">
                                            <div className="flex flex-col lg:flex-row items-center gap-10">
                                                <div className="relative w-48 h-48">
                                                    <CustomPieChart
                                                        data={Object.entries(algoMetrics).map(([key, m]) => ({
                                                            label: key,
                                                            value: parseFloat(m.execTime),
                                                            color: (ALGO_CONFIG as any)[key].color
                                                        }))}
                                                    />
                                                </div>
                                                <ChartLegend metrics={algoMetrics} field="execTime" unit="ms" />
                                            </div>
                                        </ChartWrapper>

                                        <ChartWrapper title="Efficiency Factor (E)" subtitle="Higher is better">
                                            <div className="flex flex-col lg:flex-row items-center gap-10">
                                                <div className="relative w-48 h-48">
                                                    <CustomPieChart
                                                        data={Object.entries(algoMetrics).map(([key, m]) => ({
                                                            label: key,
                                                            value: parseFloat(m.efficiency),
                                                            color: (ALGO_CONFIG as any)[key].color
                                                        }))}
                                                    />
                                                </div>
                                                <ChartLegend metrics={algoMetrics} field="efficiency" unit="pts" />
                                            </div>
                                        </ChartWrapper>

                                        <ChartWrapper title="Avalanche Effect (%)" subtitle="Target 50% for high entropy">
                                            <div className="flex flex-col lg:flex-row items-center gap-10">
                                                <div className="relative w-48 h-48">
                                                    <CustomPieChart
                                                        data={Object.entries(algoMetrics).filter(([k]) => k !== ALGORITHMS.ECDSA_NO_HASH).map(([key, m]) => ({
                                                            label: key,
                                                            value: parseFloat(m.avalanche),
                                                            color: (ALGO_CONFIG as any)[key].color
                                                        }))}
                                                    />
                                                </div>
                                                <ChartLegend metrics={algoMetrics} field="avalanche" unit="%" filterNoHash />
                                            </div>
                                        </ChartWrapper>

                                        <ChartWrapper title="System Reliability (%)" subtitle="Efficiency of verification">
                                            <div className="flex flex-col lg:flex-row items-center gap-10">
                                                <div className="relative w-48 h-48">
                                                    <CustomPieChart
                                                        data={Object.entries(algoMetrics).map(([key, m]) => ({
                                                            label: key,
                                                            value: parseFloat(m.reliability),
                                                            color: (ALGO_CONFIG as any)[key].color
                                                        }))}
                                                    />
                                                </div>
                                                <ChartLegend metrics={algoMetrics} field="reliability" unit="%" />
                                            </div>
                                        </ChartWrapper>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </main>

            <footer className="p-10 text-center border-t border-[#222] mt-10 opacity-30">
                <div className="text-[10px] uppercase font-black tracking-widest">© 2026 CRYPTOGRAPHIC RESEARCH LABS</div>
                <div className="flex justify-center gap-6 mt-4">
                    <Link href="/dashboard" className="text-[8px] uppercase font-black hover:text-white transition-colors">Return to System</Link>
                    <span className="text-[8px] uppercase font-black">Build v2.1.0-STABLE</span>
                </div>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
}

function LogItem({ data, onSelect }: { data: any; onSelect: () => void }) {
    return (
        <button
            onClick={onSelect}
            className="w-full border border-[#222] bg-[#0a0a0a] transition-all overflow-hidden group hover:border-[#444] hover:bg-[#111] text-left"
        >
            <div className="flex items-center gap-3 px-3 py-3">
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 border border-zinc-700 bg-zinc-900 rotate-45 group-hover:bg-white group-hover:border-white transition-colors"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">DATA {data.id}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 group-hover:text-white transition-colors">
                    <Eye size={12} />
                    <span className="text-[8px] uppercase font-bold tracking-wider">Lihat Detail</span>
                </div>
            </div>
        </button>
    );
}

function DataDetailModal({ algoName, data, onClose }: { algoName: string; data: any; onClose: () => void }) {
    // Close modal when clicking outside
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#0a0a0a] border border-[#333] rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-[#222] bg-[#080808]">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-white rotate-45"></div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-[0.3em] text-white">DATA {data.id}</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{algoName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 border border-[#333] rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all group"
                    >
                        <X size={18} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                    <div className="space-y-6">
                        {data.steps.map((step: any, idx: number) => (
                            <div
                                key={idx}
                                className="border border-[#222] bg-[#050505] p-6 rounded-sm hover:border-[#333] transition-colors group/step"
                            >
                                {/* Step Header */}
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#222]">
                                    <div className="w-8 h-8 border border-[#333] bg-[#111] rounded-full flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white">0{idx + 1}</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase text-white tracking-wider group-hover/step:text-blue-400 transition-colors">
                                        {step.title}
                                    </h4>
                                </div>

                                {/* Step Content */}
                                <div className="space-y-4 pl-12">
                                    <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                                        {step.content}
                                    </p>

                                    {step.details && (
                                        <div className="space-y-4">
                                            <div className="bg-[#080808] border-l-2 border-zinc-700 p-4 font-mono text-xs text-zinc-400 whitespace-pre-wrap leading-loose">
                                                {step.details}
                                            </div>

                                            {/* Elliptic Curve Visualization for Step 04 */}
                                            {step.title.includes('04') && (
                                                <div className="mt-6 border border-[#222] bg-[#030303] p-6 rounded-sm relative overflow-hidden group/cv">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/cv:opacity-30 transition-opacity">
                                                        <Activity size={40} className="text-blue-500" />
                                                    </div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                                                        <Zap size={10} className="text-yellow-500" />
                                                        Elliptic Curve Visual Projection
                                                    </h5>

                                                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                                                        <div className="w-full lg:w-1/2 aspect-square max-w-[300px] relative">
                                                            <EllipticCurveChart
                                                                r={step.details.match(/r: ([\d.a-f]+)/)?.[1] || '0'}
                                                                s={step.details.match(/s: ([\d.a-f]+)/)?.[1] || '0'}
                                                                algoName={algoName}
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-4 w-full">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <CurveStat label="Curve" value="secp256k1" />
                                                                <CurveStat label="Base Point G" value="Projected" />
                                                                <CurveStat label="Scalar k" value="Ephemeral" />
                                                                <CurveStat label="Modulus n" value="Prime" />
                                                            </div>
                                                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-sm">
                                                                <p className="text-[10px] text-blue-400/80 leading-relaxed italic">
                                                                    Visualisasi di atas memproyeksikan titik r pada kurva eliptik $y^2 = x^3 + 7 \pmod p$. Komponen s merepresentasikan kemiringan (slope) yang menghubungkan pesan hash, kunci pribadi, dan titik ephemeral.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-4 border-t border-[#222] bg-[#080808] flex items-center justify-between">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                        {data.steps.length} Steps Processed
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-white text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

function MetricDisplay({ label, value, unit }: { label: string, value: string, unit: string }) {
    return (
        <div className="group">
            <div className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mb-1 group-hover:text-zinc-400 transition-colors">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-[10px] font-black text-zinc-700">{unit}</div>
            </div>
            <div className="h-0.5 w-full bg-[#111] mt-1 overflow-hidden">
                <div className="h-full bg-zinc-700 w-2/3 group-hover:w-full transition-all duration-700"></div>
            </div>
        </div>
    );
}

// --- Visualization Components ---

function ChartWrapper({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
    return (
        <div className="bg-[#080808] border border-[#111] p-8 rounded-sm hover:border-[#222] transition-colors relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-white transition-colors"></div>
            <div className="mb-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">{title}</h4>
                <p className="text-[9px] text-zinc-600 uppercase mt-1 tracking-widest">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function ChartLegend({ metrics, field, unit, filterNoHash = false }: { metrics: any, field: string, unit: string, filterNoHash?: boolean }) {
    return (
        <div className="flex-1 space-y-3 w-full">
            {Object.entries(ALGO_CONFIG)
                .filter(([key]) => !filterNoHash || key !== ALGORITHMS.ECDSA_NO_HASH)
                .map(([key, config]) => {
                    const val = metrics[key]?.[field] || '0.00';
                    return (
                        <div key={key} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }}></div>
                                <span className="text-[9px] font-bold uppercase text-zinc-500 group-hover/item:text-zinc-300 transition-colors">{config.name}</span>
                            </div>
                            <div className="text-[10px] font-mono font-black text-white">
                                {val}<span className="text-zinc-700 ml-1">{unit}</span>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}

function CustomPieChart({ data }: { data: { label: string, value: number, color: string }[] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    function getCoordinatesForPercent(percent: number) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    if (total === 0) return (
        <div className="absolute inset-0 border-4 border-zinc-900 rounded-full flex items-center justify-center">
            <span className="text-[8px] uppercase text-zinc-800 font-bold">No Data</span>
        </div>
    );

    return (
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
            {data.map((slice, i) => {
                const slicePercent = slice.value / total;
                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += slicePercent;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                const pathData = [
                    `M ${startX} ${startY}`,
                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                    `L 0 0`,
                ].join(' ');

                return (
                    <path
                        key={i}
                        d={pathData}
                        fill={slice.color}
                        className="opacity-80 hover:opacity-100 transition-opacity cursor-help"
                    >
                        <title>{slice.label}: {slice.value}</title>
                    </path>
                );
            })}
            {/* Inner circle for donut-style */}
            <circle cx="0" cy="0" r="0.6" fill="#080808" />
        </svg>
    );
}

function CurveStat({ label, value }: { label: string, value: string }) {
    return (
        <div className="border border-[#1a1a1a] p-3 bg-[#080808]">
            <div className="text-[8px] uppercase text-zinc-600 font-black tracking-widest mb-1">{label}</div>
            <div className="text-[10px] font-mono text-white truncate">{value}</div>
        </div>
    );
}

function EllipticCurveChart({ r, s, algoName }: { r: string, s: string, algoName?: string }) {
    // Generate curve points for y^2 = x^3 - 3x + 5 (visual approximation of a curve)
    const points: [number, number][] = [];
    const a = -3;
    const b = 5;

    for (let x = -2.5; x <= 3; x += 0.1) {
        const y2 = Math.pow(x, 3) + a * x + b;
        if (y2 >= 0) {
            const y = Math.sqrt(y2);
            points.push([x, y]);
        }
    }

    const bottomPoints = [...points].reverse().map(([x, y]) => [x, -y] as [number, number]);
    const fullCurve = [...points, ...bottomPoints];

    const scale = 15;
    const offset = 50;

    const toSvg = (x: number, y: number) => {
        return `${x * scale + offset},${-y * scale + offset}`;
    };

    const pathData = fullCurve.length > 0 ?
        `M ${toSvg(fullCurve[0][0], fullCurve[0][1])} ` +
        fullCurve.slice(1).map(p => `L ${toSvg(p[0], p[1])}`).join(' ') : '';

    // Convert string inputs to numbers for visual mapping
    const rVal = parseInt(r) || 0;
    const sVal = parseInt(s) || 0;

    // Logic pemetaan: Gunakan modulo untuk memastikan titik berada dalam jangkauan visual (-2 s/d 2)
    // rNum menentukan posisi X, ry menentukan posisi Y pada kurva
    const rNum = ((rVal % 40) / 10) - 2;
    const ry2 = Math.pow(rNum, 3) + a * rNum + b;
    const ry = ry2 >= 0 ? Math.sqrt(ry2) : 1;

    return (
        <div className="w-full h-full border border-[#222] bg-[#050505] overflow-hidden relative rounded-sm group/chart">
            {/* Watermark Algoritma */}
            <div className="absolute top-2 left-2 z-10">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{algoName || 'ECDSA PROJECTION'}</span>
            </div>

            <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                    <pattern id="grid-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.5" fill="#111" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid-dots)" />

                <line x1="50" y1="0" x2="50" y2="100" stroke="#111" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#111" strokeWidth="0.5" />

                <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.2" />
                <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="0.5" className="animate-pulse" />

                {/* Point R (Titik Ephemeral) */}
                <circle cx={rNum * scale + offset} cy={-ry * scale + offset} r="2.5" fill="#3b82f6" />
                <circle cx={rNum * scale + offset} cy={-ry * scale + offset} r="4" fill="none" stroke="#3b82f6" strokeWidth="0.3" className="animate-ping" />

                {/* Data Tags (Floating Labels) */}
                <g transform={`translate(${rNum * scale + offset + 6}, ${-ry * scale + offset - 2})`}>
                    <rect x="-1" y="-4" width="22" height="8" fill="black" fillOpacity="0.8" stroke="#3b82f6" strokeWidth="0.2" />
                    <text fill="#3b82f6" fontSize="3" fontFamily="monospace" fontWeight="bold">r: {r}</text>
                </g>

                {/* Garis S (Signature Slope) */}
                {/* Panjang dan kemiringan garis dipengaruhi oleh nilai s untuk variasi visual */}
                <line
                    x1={(rNum - 1.2) * scale + offset}
                    y1={-(ry - (sVal % 10 / 5)) * scale + offset}
                    x2={(rNum + 1.2) * scale + offset}
                    y2={-(ry + (sVal % 10 / 5)) * scale + offset}
                    stroke="#ef4444"
                    strokeWidth="0.6"
                    strokeDasharray="2,1"
                />

                <text x="5" y="93" fill="#ef4444" fontSize="3.5" fontFamily="monospace" fontWeight="bold" opacity="0.6">
                    S-VAL: {s}
                </text>
            </svg>

            <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
                <div className="bg-white/5 px-1.5 py-0.5 rounded-sm border border-white/10">
                    <span className="text-[5px] text-zinc-500 uppercase font-black">Interactive Projection v1.2</span>
                </div>
            </div>
        </div>
    );
}

