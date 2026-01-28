import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const approvals = await prisma.approval.findMany({
        include: { workflowRule: true }
    });
    console.log('--- Pending Approvals ---');
    console.log(JSON.stringify(approvals, null, 2));

    const logs = await prisma.actionLog.findMany();
    console.log('\n--- Action Logs ---');
    console.log(JSON.stringify(logs, null, 2));
}

check().finally(() => prisma.$disconnect());
