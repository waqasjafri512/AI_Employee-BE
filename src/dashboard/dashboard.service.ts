import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(businessId: string) {
        const [
            totalMessages,
            activeConversations,
            pendingApprovals,
            avgConfidence
        ] = await Promise.all([
            this.prisma.message.count({
                where: { conversation: { businessId } }
            }),
            this.prisma.conversation.count({
                where: { businessId }
            }),
            this.prisma.approval.count({
                where: {
                    status: 'PENDING',
                    workflowRule: { businessId }
                }
            }),
            this.prisma.intent.aggregate({
                where: { message: { conversation: { businessId } } },
                _avg: {
                    confidence: true
                }
            })
        ]);

        return {
            totalInteractions: totalMessages,
            activeSessions: activeConversations,
            pendingApprovals: pendingApprovals,
            systemHealth: (avgConfidence._avg.confidence || 0) * 100
        };
    }

    async getEngagement(businessId: string) {
        const [recentApprovals, recentActions] = await Promise.all([
            this.prisma.approval.findMany({
                where: { workflowRule: { businessId } },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { workflowRule: true }
            }),
            this.prisma.actionLog.findMany({
                where: { businessId },
                take: 10,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const unified = [
            ...recentApprovals.map(item => ({
                id: item.id,
                type: 'approval',
                content: (item.proposedAction as any).original_text || 'Inquiry',
                status: item.status,
                createdAt: item.createdAt,
                intent: item.workflowRule.intentName
            })),
            ...recentActions.map(item => ({
                id: item.id,
                type: 'auto-reply',
                content: (item.payload as any).reply_text || 'Auto Response',
                status: item.status === 'SUCCESS' ? 'SENT' : 'FAILED',
                createdAt: item.createdAt,
                intent: (item.payload as any).intent || 'general'
            }))
        ];

        return unified
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10);
    }

    async search(businessId: string, query: string) {
        return this.prisma.message.findMany({
            where: {
                conversation: { businessId },
                content: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            take: 10,
            include: {
                conversation: true
            }
        });
    }

    async exportLogs(businessId: string) {
        const [approvals, actions] = await Promise.all([
            this.prisma.approval.findMany({
                where: { workflowRule: { businessId } },
                include: { workflowRule: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.actionLog.findMany({
                where: { businessId },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const unified = [
            ...approvals.map(item => ({
                Date: item.createdAt.toISOString(),
                Type: 'Manual Approval',
                Content: (item.proposedAction as any).original_text || 'Inquiry',
                Intent: item.workflowRule.intentName,
                Status: item.status
            })),
            ...actions.map(item => ({
                Date: item.createdAt.toISOString(),
                Type: 'Auto-Reply',
                Content: (item.payload as any).reply_text || 'Auto Response',
                Intent: (item.payload as any).intent || 'general',
                Status: item.status === 'SUCCESS' ? 'SENT' : 'FAILED'
            }))
        ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        const headers = ['Date', 'Type', 'Content', 'Intent', 'Status'];
        const csvRows = [
            headers.join(','),
            ...unified.map(row => headers.map(header => `"${(row as any)[header]?.replace(/"/g, '""')}"`).join(','))
        ];

        return csvRows.join('\n');
    }

    // New Simulation Helper
    async simulateIncomingMessage(from: string, text: string) {
        // This is a direct trigger of the logic in WhatsappController but bypasses the complex body parsing
        return {
            from,
            text,
            timestamp: new Date().toISOString(),
            status: 'SIMULATED'
        };
    }
}
