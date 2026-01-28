import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ApprovalsService {
    constructor(private prisma: PrismaService) { }

    async createApprovalRequest(businessId: string, messageId: string, intentName: string, proposedAction: any) {
        // Find or create a rule reference
        let rule = await this.prisma.workflowRule.findFirst({
            where: { businessId, intentName },
        });

        if (!rule) {
            rule = await this.prisma.workflowRule.create({
                data: {
                    businessId,
                    intentName,
                    requiresApproval: true,
                },
            });
        }

        return this.prisma.approval.create({
            data: {
                workflowRuleId: rule.id,
                proposedAction,
                status: 'PENDING',
            },
        });
    }

    async getPendingApprovals(businessId: string) {
        return this.prisma.approval.findMany({
            where: {
                status: 'PENDING',
                workflowRule: { businessId }
            },
            include: {
                workflowRule: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateApprovalStatus(id: string, status: 'APPROVED' | 'REJECTED', userId: string, businessId: string) {
        // Verify ownership
        const approval = await this.prisma.approval.findUnique({
            where: { id },
            include: { workflowRule: true }
        });

        if (!approval) throw new NotFoundException('Approval not found');
        if (approval.workflowRule.businessId !== businessId) {
            throw new ForbiddenException('You do not have access to this approval');
        }

        return this.prisma.approval.update({
            where: { id },
            data: {
                status,
                reviewedBy: userId,
            },
        });
    }
}
