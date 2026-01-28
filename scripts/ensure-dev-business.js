const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.business.upsert({
        where: { id: 'dev-business-id' },
        update: {},
        create: {
            id: 'dev-business-id',
            name: 'Dev Business',
        },
    });
    console.log('Default business ensured.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
