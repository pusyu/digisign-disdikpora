// Type definitions for Digisign

export interface PDFObject {
    id: string;
    type: 'image';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImageObject extends PDFObject {
    type: 'image';
    file: File | Blob;
    payload: HTMLImageElement;
    isQR?: boolean;
}

export interface ProcessedPDF {
    file: File;
    name: string;
    blob?: Blob;
    previewUrl?: string;
    ownerName: string;
    status: 'pending' | 'processing' | 'done' | 'error';
}

export interface CertificateMetadata {
    ownerName: string;
    eventName: string;
    issueDate: string;
    signerName: string;
    signerPosition: string;
    algorithm: string;
    timestamp?: string;
    signers?: string[];
}
