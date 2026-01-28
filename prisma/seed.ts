import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const business = await prisma.business.upsert({
        where: { id: 'dev-business-id' },
        update: {},
        create: {
            id: 'dev-business-id',
            name: 'Dev Real Estate',
            timezone: 'Asia/Karachi',
        },
    });

    await prisma.user.upsert({
        where: { email: 'admin@dev.com' },
        update: {},
        create: {
            email: 'admin@dev.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'owner',
            businessId: business.id,
        },
    });

    console.log('Seeding complete: Default business and user created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
