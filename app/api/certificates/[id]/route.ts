import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const certificate = await prisma.certificate.findUnique({
            where: { id },
            include: {
                approvals: {
                    include: {
                        user: {
                            select: { name: true, position: true }
                        }
                    }
                }
            }
        });

        if (!certificate) {
            return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(certificate);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        return NextResponse.json({ error: 'Gagal mengambil data sertifikat' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await prisma.certificate.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
