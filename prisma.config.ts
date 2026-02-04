import { defineConfig } from '@prisma/config';

export default defineConfig({
    // @ts-ignore - 'seed' is valid but sometimes missing from PrismaConfig types in 6.x
    seed: {
        command: 'node prisma/seed-admin.js',
    },
});
