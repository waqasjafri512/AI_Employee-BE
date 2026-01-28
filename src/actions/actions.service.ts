import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ActionsService {
    private readonly logger = new Logger(ActionsService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    async executeAction(approvalId: string) {
        const approval = await this.prisma.approval.findUnique({
            where: { id: approvalId },
            include: {
                workflowRule: true,
            },
        });

        if (!approval || approval.status !== 'APPROVED') {
            this.logger.warn(`Cannot execute action for approval ${approvalId}: Invalid status or not found.`);
            return;
        }

        const { proposedAction, workflowRule } = approval;
        const { reply_text, recipient_number } = proposedAction as any;

        this.logger.log(`Executing action for ${recipient_number}: "${reply_text}"`);

        try {
            // 1. WhatsApp Cloud API Integration
            await this.sendWhatsappMessage(recipient_number, reply_text);

            // 2. Log Execution
            await this.prisma.actionLog.create({
                data: {
                    businessId: workflowRule.businessId,
                    actionType: 'whatsapp_reply',
                    status: 'SUCCESS',
                    payload: { approvalId, reply_text },
                    performedBy: approval.reviewedBy,
                },
            });

            this.logger.log(`Action executed successfully for approval ${approvalId}`);
        } catch (error) {
            this.logger.error(`Action execution failed for approval ${approvalId}`, error);

            await this.prisma.actionLog.create({
                data: {
                    businessId: workflowRule.businessId,
                    actionType: 'whatsapp_reply',
                    status: 'FAILED',
                    payload: { approvalId, error: error.message },
                    performedBy: approval.reviewedBy,
                },
            });
        }
    }

    async executeAutoAction(businessId: string, recipientNumber: string, replyText: string, intent: string) {
        this.logger.log(`Executing AUTO action for ${recipientNumber}: "${replyText}" (Intent: ${intent})`);

        try {
            // 1. WhatsApp Cloud API Integration
            await this.sendWhatsappMessage(recipientNumber, replyText);

            // 2. Log Execution
            await this.prisma.actionLog.create({
                data: {
                    businessId,
                    actionType: 'whatsapp_reply',
                    status: 'SUCCESS',
                    payload: {
                        reply_text: replyText,
                        recipient_number: recipientNumber,
                        mode: 'auto-reply',
                        intent
                    },
                },
            });

            this.logger.log(`Auto-action executed successfully for ${recipientNumber}`);
        } catch (error) {
            this.logger.error(`Auto-action execution failed for ${recipientNumber}`, error);

            await this.prisma.actionLog.create({
                data: {
                    businessId,
                    actionType: 'whatsapp_reply',
                    status: 'FAILED',
                    payload: { error: error.message, recipient_number: recipientNumber, intent },
                },
            });
        }
    }

    public async sendWhatsappMessage(to: string, text: string) {
        const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
        const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

        if (!accessToken || !phoneNumberId || accessToken === 'mock-token' || accessToken.includes('your_whatsapp')) {
            this.logger.warn('WhatsApp API not configured or using placeholder. Skipping real call.');
            return { mock: true, success: true };
        }

        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

        await axios.post(
            url,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: text },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
