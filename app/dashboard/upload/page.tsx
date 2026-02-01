'use client';

import { useState, useEffect } from 'react';
import { FileUp, Save, Trash2, Check, X, QrCode, ImagePlus } from 'lucide-react';
import PDFPage from '@/components/PDFPage';
import ImageComponent from '@/components/Image';
import Sidebar from '@/components/Sidebar';
import { readAsImage, readAsDataURL, readAsPDF } from '@/lib/asyncReader';
import { ggID, generateUUID } from '@/lib/helper';
import { savePDF } from '@/lib/pdf';
import type { ImageObject, CertificateMetadata, ProcessedPDF } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import * as pdfjsLib from 'pdfjs-dist';
import download from 'downloadjs';
import { generateQRValue } from '@/lib/crypto';

const genID = ggID();

export default function Home() {
    const [pdfFiles, setPdfFiles] = useState<File[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfName, setPdfName] = useState('');
    const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);
    const [pagesScale, setPagesScale] = useState<number[]>([]);
    const [allObjects, setAllObjects] = useState<ImageObject[][]>([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(-1);
    const [saving, setSaving] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [processedPDFs, setProcessedPDFs] = useState<ProcessedPDF[]>([]);
    const [batchQRValue, setBatchQRValue] = useState('');
    const [metadata, setMetadata] = useState<CertificateMetadata>({
        ownerName: '',
        eventName: '',
        issueDate: new Date().toISOString().split('T')[0],
        signerName: '',
        signerPosition: '',
        algorithm: 'ecdsa_sha128',
        timestamp: new Date().toISOString(),
        signers: [], // Array of user IDs
    });
    const [availableSigners, setAvailableSigners] = useState<any[]>([]);
    const [isMetaSidebarOpen, setIsMetaSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchSigners = async () => {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();
                setAvailableSigners(data.filter((u: any) => u.role === 'SIGNER'));
            } catch (error) {
                console.error('Failed to fetch signers', error);
            }
        };
        fetchSigners();
    }, []);

    const onUploadPDF = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let files: File[] = [];

        if ('dataTransfer' in e) {
            files = Array.from(e.dataTransfer.files);
        } else {
            files = e.target.files ? Array.from(e.target.files) : [];
        }

        const pdfFilesOnly = files.filter(f => f.type === 'application/pdf').slice(0, 50);
        if (pdfFilesOnly.length === 0) return;

        setPdfFiles(pdfFilesOnly);
        const firstFile = pdfFilesOnly[0];

        // Auto-fill owner name from filename of the first file
        const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setMetadata(prev => ({ ...prev, ownerName: nameWithoutExt }));

        setSelectedPageIndex(-1);
        try {
            await addPDF(firstFile);
            setSelectedPageIndex(0);
        } catch (e) {
            console.error(e);
        }
    };

    const addPDF = async (file: File) => {
        try {
            const pdf = await readAsPDF(file);
            setPdfName(file.name);
            setPdfFile(file);

            const numPages = pdf.numPages;
            const pagesArray: pdfjsLib.PDFPageProxy[] = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                pagesArray.push(page);
            }

            setPages(pagesArray);
            setAllObjects(Array(numPages).fill(null).map(() => []));
            setPagesScale(Array(numPages).fill(1));
        } catch (e) {
            console.error('Failed to add PDF.', e);
            throw e;
        }
    };

    const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedPageIndex >= 0) {
            await addImage(file);
        }
        e.target.value = '';
    };

    const addImage = async (file: File) => {
        try {
            const url = await readAsDataURL(file);
            const img = await readAsImage(url);
            const id = genID().toString();
            const { width, height } = img;

            const object: ImageObject = {
                id,
                type: 'image',
                width,
                height,
                x: 0,
                y: 0,
                payload: img,
                file,
            };

            setAllObjects(prev => prev.map((objects, pIndex) =>
                pIndex === selectedPageIndex ? [...objects, object] : objects
            ));
        } catch (e) {
            console.error('Failed to add image.', e);
        }
    };

    const selectPage = (index: number) => {
        setSelectedPageIndex(index);
    };

    const updateObject = (objectId: string, payload: Record<string, any>) => {
        setAllObjects(prev => prev.map((objects, pIndex) =>
            pIndex === selectedPageIndex
                ? objects.map(object =>
                    object.id === objectId ? { ...object, ...payload } as ImageObject : object
                )
                : objects
        ));
    };

    const deleteObject = (objectId: string) => {
        setAllObjects(prev => prev.map((objects, pIndex) =>
            pIndex === selectedPageIndex
                ? objects.filter(object => object.id !== objectId)
                : objects
        ));
    };

    const onMeasure = (scale: number, index: number) => {
        setPagesScale(prev => {
            const newScales = [...prev];
            newScales[index] = scale;
            return newScales;
        });
    };

    const addQRToPDF = async (canvas: HTMLCanvasElement) => {
        if (selectedPageIndex < 0) return;

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const img = await readAsImage(dataUrl);

            // Create a blob from dataURL for the ImageObject
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "qr-code.png", { type: "image/png" });

            const id = generateUUID();
            const object: ImageObject = {
                id,
                type: 'image',
                width: 150, // Default QR size
                height: 150,
                x: 20, // Some padding
                y: 20,
                payload: img,
                file,
                isQR: true
            };

            setAllObjects(prev => prev.map((objects, pIndex) =>
                pIndex === selectedPageIndex ? [...objects, object] : objects
            ));
        } catch (e) {
            console.error('Failed to add QR code.', e);
        }
    };

    const downloadSingle = (processed: ProcessedPDF) => {
        if (processed.blob) {
            download(processed.blob, processed.name, 'application/pdf');
        }
    };

    const downloadAll = async () => {
        const done = processedPDFs.filter(p => p.status === 'done' && p.blob);
        for (const item of done) {
            downloadSingle(item);
            // Delay to avoid browser download blocking
            await new Promise(r => setTimeout(r, 600));
        }
    };

    const handleSavePDF = async () => {
        if (!pdfFile || saving || !pages.length) return;
        setSaving(true);
        setProcessedPDFs([]);

        try {
            if (pdfFiles.length > 1) {
                const results: ProcessedPDF[] = [];
                // Batch processing
                for (let i = 0; i < pdfFiles.length; i++) {
                    const currentFile = pdfFiles[i];
                    setBatchProgress({ current: i + 1, total: pdfFiles.length });

                    const currentOwnerName = currentFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                    const batchKeysRaw = localStorage.getItem('pdf_editor_keys');
                    const batchKeyPair = batchKeysRaw ? JSON.parse(batchKeysRaw) : null;
                    const batchPKey = batchKeyPair ? batchKeyPair.publicKey : '';

                    // Prepare metadata for this specific certificate
                    const currentCertMetadata = { ...metadata, ownerName: currentOwnerName };

                    // Create a copy of allObjects to modify dynamically
                    let currentAllObjects = [...allObjects];

                    // Check if there's a QR code that needs updating
                    if (batchKeyPair) {
                        const newQRUrl = generateQRValue(currentCertMetadata, batchKeyPair, window.location.origin);
                        setBatchQRValue(newQRUrl);

                        // Wait for React to render the hidden QRCodeCanvas
                        await new Promise(r => setTimeout(r, 150));

                        const qrCanvas = document.getElementById('batch-qr-canvas') as HTMLCanvasElement;
                        if (qrCanvas) {
                            const dataUrl = qrCanvas.toDataURL('image/png');
                            const img = await readAsImage(dataUrl);
                            const res = await fetch(dataUrl);
                            const blob = await res.blob();

                            // Update allObjects copy for this run
                            currentAllObjects = currentAllObjects.map(pageObjects =>
                                pageObjects.map(obj => {
                                    if (obj.isQR) {
                                        return { ...obj, payload: img, file: blob };
                                    }
                                    return obj;
                                })
                            );
                        }
                    }

                    // 1. Generate Blob locally first
                    const blob = await savePDF(currentFile, currentAllObjects, currentFile.name, false);

                    if (blob) {
                        // 2. Upload to Server with FormData
                        const formData = new FormData();
                        formData.append('ownerName', currentOwnerName);
                        formData.append('eventName', metadata.eventName);
                        formData.append('issueDate', metadata.issueDate);
                        formData.append('signerName', metadata.signerName);
                        formData.append('signerPosition', metadata.signerPosition);
                        formData.append('pdfName', currentFile.name);
                        formData.append('algorithm', metadata.algorithm);
                        formData.append('publicKey', batchPKey);
                        formData.append('signers', JSON.stringify(metadata.signers || []));
                        formData.append('file', blob as Blob, currentFile.name);

                        await fetch('/api/certificates', {
                            method: 'POST',
                            body: formData
                        });

                        const previewUrl = URL.createObjectURL(blob as Blob);
                        results.push({
                            file: currentFile,
                            name: currentFile.name,
                            blob: blob as Blob,
                            previewUrl,
                            ownerName: currentOwnerName,
                            status: 'done'
                        });
                        setProcessedPDFs([...results]);
                    }

                    if (pdfFiles.length > 5) await new Promise(r => setTimeout(r, 200));
                }
                setBatchProgress(null);
                alert(`Successfully processed ${pdfFiles.length} files. You can now download them from the Batch Manager.`);
            } else {
                // Single file processing
                const storedKeys = localStorage.getItem('pdf_editor_keys');
                const pKey = storedKeys ? JSON.parse(storedKeys).publicKey : '';

                // 1. Generate Blob
                const blob = await savePDF(pdfFile, allObjects, pdfName || pdfFile.name, false);

                // 2. Upload
                if (blob) {
                    const formData = new FormData();
                    formData.append('ownerName', metadata.ownerName);
                    formData.append('eventName', metadata.eventName);
                    formData.append('issueDate', metadata.issueDate);
                    formData.append('signerName', metadata.signerName);
                    formData.append('signerPosition', metadata.signerPosition);
                    formData.append('pdfName', pdfName || pdfFile.name);
                    formData.append('algorithm', metadata.algorithm);
                    formData.append('publicKey', pKey);
                    formData.append('signers', JSON.stringify(metadata.signers || []));
                    formData.append('file', blob as Blob, pdfName || pdfFile.name);

                    await fetch('/api/certificates', {
                        method: 'POST',
                        body: formData
                    });

                    alert('Sertifikat berhasil diunggah!');
                }
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save. Check console for details.');
        } finally {
            setSaving(false);
            setBatchProgress(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        onUploadPDF(e);
    };

    return (
        <div className="flex flex-col items-center">
            <Sidebar
                metadata={metadata}
                setMetadata={setMetadata}
                onAddQR={addQRToPDF}
                availableSigners={availableSigners}
                isOpen={isMetaSidebarOpen}
                onToggle={() => setIsMetaSidebarOpen(!isMetaSidebarOpen)}
            />

            {/* Hidden Inputs */}
            <input
                type="file"
                name="pdf"
                id="pdf-upload"
                accept="application/pdf"
                onChange={onUploadPDF}
                className="hidden"
                multiple
            />
            <input
                type="file"
                id="image-upload"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={onUploadImage}
            />

            <div className={`transition-all duration-300 ${isMetaSidebarOpen ? 'pr-80' : 'pr-0'} w-full flex justify-center mb-8 px-10`}>
                <div className="w-full max-w-6xl flex gap-6">
                    <label
                        className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 border-b-4 border-blue-800"
                        htmlFor="pdf-upload"
                    >
                        <FileUp size={24} />
                        <span>Upload PDF Sertifikat</span>
                    </label>

                    <button
                        onClick={handleSavePDF}
                        className={`flex-1 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 border-b-4 border-indigo-800 ${pages.length === 0 || saving || !pdfFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={pages.length === 0 || saving || !pdfFile}
                    >
                        {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={24} />}
                        <span>{batchProgress ? `Processing ${batchProgress.current}/${batchProgress.total}` : (pdfFiles.length > 1 ? `Save & Submit All (${pdfFiles.length})` : 'Save & Submit Approval')}</span>
                    </button>
                </div>
            </div>

            {/* PDF Pages Area */}
            <div className={`w-full flex flex-col items-center pb-20 transition-all duration-300 ${isMetaSidebarOpen ? 'pr-80' : 'pr-0'}`}>
                {pages.length > 0 ? (
                    <div className="w-full flex flex-col items-center gap-8">
                        {pages.map((page, pIndex) => (
                            <div
                                key={pIndex}
                                className="relative group"
                                onMouseDown={() => selectPage(pIndex)}
                                onTouchStart={() => selectPage(pIndex)}
                            >
                                <div className={`relative shadow-2xl rounded-sm transition-all duration-300 ${pIndex === selectedPageIndex ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'}`}>
                                    <PDFPage page={page} onMeasure={(scale) => onMeasure(scale, pIndex)} />

                                    <div
                                        className="absolute top-0 left-0 transform origin-top-left"
                                        style={{
                                            transform: `scale(${pagesScale[pIndex]})`,
                                            touchAction: 'none',
                                        }}
                                    >
                                        {allObjects[pIndex]?.map((object) => (
                                            <ImageComponent
                                                key={object.id}
                                                object={object}
                                                pageScale={pagesScale[pIndex]}
                                                onUpdate={updateObject}
                                                onDelete={deleteObject}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -left-12 top-0 h-full flex items-start pt-2">
                                    <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded">HLM {pIndex + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full max-w-4xl h-[50vh] flex flex-col justify-center items-center border-4 border-dashed border-gray-200 rounded-3xl bg-white shadow-inner">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <FileUp size={40} className="text-blue-500 animate-bounce" />
                        </div>
                        <span className="font-bold text-2xl text-gray-400">Tarik file PDF ke sini untuk memulai</span>
                        <p className="text-gray-400 mt-2">Dukung batch upload hingga 50 file sekaligus</p>
                    </div>
                )}
            </div>

            {/* Floating Action Button for Image Upload */}
            {pages.length > 0 && selectedPageIndex >= 0 && (
                <label
                    htmlFor="image-upload"
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-full shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group"
                    title="Tambah Gambar ke Halaman"
                >
                    <ImagePlus size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Tambah Gambar</span>
                </label>
            )}

            {/* Hidden QR Generator for Batch Processing */}
            <div style={{ display: 'none' }}>
                <QRCodeCanvas
                    id="batch-qr-canvas"
                    value={batchQRValue}
                    size={300}
                    level="L"
                    includeMargin={false}
                />
            </div>
        </div>
    );
}
