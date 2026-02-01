import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SIGNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await request.json(); // Array of certificate IDs

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        // Update approvals for this user and the selected certificates
        await prisma.approval.updateMany({
            where: {
                certificateId: { in: ids },
                userId: session.id,
                status: 'PENDING'
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        // Check and update certificate status for each
        for (const certId of ids) {
            const approvals = await prisma.approval.findMany({
                where: { certificateId: certId }
            });

            const allApproved = approvals.every(a => a.status === 'APPROVED');
            if (allApproved && approvals.length > 0) {
                await prisma.certificate.update({
                    where: { id: certId },
                    data: { status: 'APPROVED' }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Bulk approve error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
