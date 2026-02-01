import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const certificateId = (await params).id;
        const userId = session.id;

        // Update the specific approval record for this user and certificate
        await prisma.approval.update({
            where: {
                certificateId_userId: {
                    certificateId,
                    userId
                }
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        // Check if all approvals for this certificate are DONE
        const approvals = await prisma.approval.findMany({
            where: { certificateId }
        });

        const allApproved = approvals.every(a => a.status === 'APPROVED');

        if (allApproved) {
            await prisma.certificate.update({
                where: { id: certificateId },
                data: { status: 'APPROVED' }
            });
        }

        return NextResponse.json({ success: true, allApproved });
    } catch (error) {
        console.error('Approval error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
