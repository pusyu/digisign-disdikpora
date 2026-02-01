import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const totalCertificates = await prisma.certificate.count();
        const approvedCertificates = await prisma.certificate.count({
            where: { status: 'APPROVED' }
        });
        const pendingCertificates = await prisma.certificate.count({
            where: { status: 'PENDING' }
        });
        const totalUsers = await prisma.user.count();

        return NextResponse.json({
            total: totalCertificates,
            approved: approvedCertificates,
            pending: pendingCertificates,
            totalUsers: totalUsers
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
