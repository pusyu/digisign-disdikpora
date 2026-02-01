import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const ownerName = formData.get('ownerName') as string;
        const eventName = formData.get('eventName') as string;
        const issueDate = formData.get('issueDate') as string;
        const signerName = formData.get('signerName') as string;
        const signerPosition = formData.get('signerPosition') as string;
        const pdfName = formData.get('pdfName') as string;
        const algorithm = formData.get('algorithm') as string;
        const publicKey = formData.get('publicKey') as string;

        // Handle signers array (JSON stringified)
        const signersStr = formData.get('signers') as string;
        const signers = signersStr ? JSON.parse(signersStr) : [];

        // Handle File
        const file = formData.get('file') as File;
        let pdfUrl = '';

        // 1. Save File
        if (file) {
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

            // Check if we should use Vercel Blob or Local
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                const blob = await put(`certificates/${fileName}`, file, {
                    access: 'public',
                });
                pdfUrl = blob.url;
            } else {
                // Local Storage
                const buffer = Buffer.from(await file.arrayBuffer());
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
                await mkdir(uploadDir, { recursive: true });
                await writeFile(path.join(uploadDir, fileName), buffer);
                pdfUrl = `/uploads/certificates/${fileName}`;
            }
        }

        // 2. Create DB Record
        const certificate = await prisma.certificate.create({
            data: {
                ownerName,
                eventName,
                issueDate: new Date(issueDate),
                signerName,
                signerPosition,
                pdfName,
                pdfUrl,
                algorithm,
                publicKey,
                status: 'PENDING',
                approvals: {
                    create: (signers || []).map((userId: string) => ({
                        userId: userId,
                        status: 'PENDING'
                    }))
                }
            },
        });

        return NextResponse.json(certificate);
    } catch (error) {
        console.error('Error creating certificate:', error);
        return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
    }
}
