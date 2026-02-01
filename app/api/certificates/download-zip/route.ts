import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function POST(request: Request) {
    try {
        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Get details to find file paths
        const certificates = await prisma.certificate.findMany({
            where: {
                id: { in: ids },
                status: 'APPROVED' // Only allow downloading approved ones
            }
        });

        if (certificates.length === 0) {
            return NextResponse.json({ error: 'No approved certificates found' }, { status: 404 });
        }

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        const stream = new Readable().wrap(archive);

        // Add files
        for (const cert of certificates) {
            const fileName = `${cert.id}.pdf`;
            const filePath = path.join(process.cwd(), 'public/uploads/certificates', fileName);

            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: cert.pdfName || fileName });
            }
        }

        archive.finalize();

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="certificates.zip"`
            }
        });
    } catch (error) {
        console.error('Zip generation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
