import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConversationsService {
    constructor(private prisma: PrismaService) { }

    async findOrCreateConversation(businessId: string, whatsappNumber: string) {
        let conversation = await this.prisma.conversation.findUnique({
            where: {
                businessId_whatsappNumber: {
                    businessId,
                    whatsappNumber,
                },
            },
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    businessId,
                    whatsappNumber,
                },
            });
        }

        return conversation;
    }

    async saveMessage(conversationId: string, role: string, content: string, metadata?: any) {
        return this.prisma.message.create({
            data: {
                conversationId,
                role,
                content,
                metadata,
            },
        });
    }

    async logIntent(messageId: string, analysis: { intent: string; confidence: number; entities: any }) {
        return this.prisma.intent.create({
            data: {
                messageId,
                intentName: analysis.intent,
                confidence: analysis.confidence,
                entities: analysis.entities,
            },
        });
    }

    async getContext(conversationId: string, limit: number = 5) {
        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
