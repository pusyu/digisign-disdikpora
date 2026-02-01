import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const certificates = await prisma.certificate.findMany({
            include: {
                approvals: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                position: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(certificates);
    } catch (error) {
        console.error('Certificates list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
