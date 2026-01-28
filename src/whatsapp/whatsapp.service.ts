import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { ActionsService } from '../actions/actions.service';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        private readonly aiService: AiService,
        private readonly conversationsService: ConversationsService,
        private readonly workflowsService: WorkflowsService,
        private readonly approvalsService: ApprovalsService,
        private readonly actionsService: ActionsService,
    ) { }

    async processMessage(from: string, text: string, businessId: string = 'dev-business-id') {
        try {
            // 1. Find/Create Conversation & Save Message
            const conversation = await this.conversationsService.findOrCreateConversation(businessId, from);
            const savedMsg = await this.conversationsService.saveMessage(conversation.id, 'user', text);
            const history = await this.conversationsService.getContext(conversation.id);

            // 2. AI Analysis
            const analysis = await this.aiService.analyzeMessage(text, businessId, history);
            await this.conversationsService.logIntent(savedMsg.id, analysis);

            // 3. Workflow Decision
            const needsApproval = await this.workflowsService.shouldRequireApproval(
                businessId,
                analysis.intent,
                analysis.confidence
            );

            let approvalRequest: any = null;
            const replyText = analysis.suggested_reply || this.generateReplyText(analysis.intent);

            if (needsApproval) {
                this.logger.log(`Intent "${analysis.intent}" requires approval. Stalling for human review.`);
                approvalRequest = await this.approvalsService.createApprovalRequest(
                    businessId,
                    savedMsg.id,
                    analysis.intent,
                    {
                        reply_text: replyText,
                        original_text: text,
                        recipient_number: from
                    }
                );
            } else {
                this.logger.log(`Intent "${analysis.intent}" is safe. Sending AUTO-REPLY.`);
                await this.actionsService.executeAutoAction(businessId, from, replyText, analysis.intent);
            }

            return {
                status: 'SUCCESS',
                from,
                text,
                analysis,
                needsApproval,
                approvalId: (approvalRequest as any)?.id || null
            };
        } catch (error) {
            this.logger.error('Message processing failed!', error.stack || error);
            throw error;
        }
    }

    private generateReplyText(intent: string): string {
        switch (intent.toLowerCase()) {
            case 'order_status':
                return "Your order is currently out for delivery! 🚚 It should arrive within the next hour.";
            case 'product_inquiry':
                return "The item you're looking for is available in 3 different colors. Would you like to see the catalog? ✨";
            case 'refund_request':
                return "I understand you'd like a refund. I've initiated the request for review. One of our human teammates will approve it shortly. 🙏";
            default:
                return "Thank you for reaching out! I've received your message and am processing your request. 🤖";
        }
    }
}
