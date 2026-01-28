import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WorkflowsService {
    private readonly logger = new Logger(WorkflowsService.name);

    constructor(private prisma: PrismaService) { }

    async shouldRequireApproval(businessId: string, intentName: string, confidence: number): Promise<boolean> {
        // 1. Check for specific business rules for this intent
        const rule = await this.prisma.workflowRule.findFirst({
            where: {
                businessId,
                intentName,
            },
        });

        if (rule) {
            if (rule.requiresApproval) return true;
            if (confidence < rule.minConfidence) return true;
            return false;
        }

        // 2. Default fallback rules
        const RISKY_INTENTS = ['complaint', 'human_agent'];
        const AUTO_REPLY_INTENTS = ['general_inquiry', 'get_pricing'];

        // If it's a general inquiry and we are somewhat confident, skip approval
        if (AUTO_REPLY_INTENTS.includes(intentName) && confidence > 0.6) {
            this.logger.log(`Auto-approving ${intentName} (Confidence: ${confidence})`);
            return false;
        }

        const DEFAULT_MIN_CONFIDENCE = 0.8;
        if (confidence < DEFAULT_MIN_CONFIDENCE) {
            this.logger.log(`High uncertainty (${confidence}). Requiring approval for intent: ${intentName}`);
            return true;
        }

        if (RISKY_INTENTS.includes(intentName)) {
            return true;
        }

        return false;
    }
}
