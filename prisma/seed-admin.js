const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: {
            password: hashedPassword,
            role: 'SUPERADMIN',
            name: 'Main Admin'
        },
        create: {
            username,
            password: hashedPassword,
            role: 'SUPERADMIN',
            name: 'Main Admin'
        }
    });

    console.log('Admin user seeded:', user.username);

    // Seed default signers
    const signers = [
        { username: 'leonardo', password: '12345678', name: 'Leonardo', position: 'Kepala Dinas' },
        { username: 'pusyu', password: '12345678', name: 'Putri Suci Renita', position: 'Sekretaris' }
    ];

    for (const s of signers) {
        const hashedS = await bcrypt.hash(s.password, 10);
        await prisma.user.upsert({
            where: { username: s.username },
            update: {
                password: hashedS,
                role: 'SIGNER',
                name: s.name,
                position: s.position
            },
            create: {
                username: s.username,
                password: hashedS,
                role: 'SIGNER',
                name: s.name,
                position: s.position
            }
        });
        console.log('Signer user seeded:', s.username);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
