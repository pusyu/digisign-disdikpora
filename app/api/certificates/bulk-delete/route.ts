import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Delete multiple certificates
        // Prisma will also delete associated approvals due to cascading (if configured)
        // or we can delete them manually if not. Assuming cascading based on usual setup.
        await prisma.certificate.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        // Note: Real file system deletion is not implemented as we are storing 
        // certificates primarily in database for this demo, or via download logic.
        // If there were physical files in a /public/certificates folder, 
        // we would iterate and delete them here.

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return NextResponse.json({ error: 'Gagal melakukan hapus massal' }, { status: 500 });
    }
}
