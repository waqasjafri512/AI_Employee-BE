import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    private getClient(apiKey: string) {
        const baseSettings: any = { apiKey };

        if (apiKey.startsWith('gsk_')) {
            this.logger.log('Using GROQ Cloud Provider.');
            baseSettings.baseURL = "https://api.groq.com/openai/v1";
        } else {
            this.logger.log('Using Grok (xAI) Provider.');
            baseSettings.baseURL = "https://api.x.ai/v1";
        }

        return new OpenAI(baseSettings);
    }

    private getModelName(apiKey: string): string {
        return apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'grok-beta';
    }

    async analyzeMessage(content: string, businessId: string, history: any[] = []) {
        this.logger.log(`AI Analysis Request: "${content}" (Business: ${businessId})`);

        // 1. Fetch Business Context
        const business = await this.prisma.business.findUnique({
            where: { id: businessId }
        }) as any;

        const contextInfo = business?.knowledgeBase || "A professional business.";
        const customInstructions = business?.aiInstructions || "Be helpful and professional.";

        // 2. Load API Key
        const apiKey = this.configService.get<string>('GROK_API_KEY')?.trim();

        if (!apiKey || apiKey === 'sk-placeholder' || apiKey.length < 10 || apiKey.includes('your_openai')) {
            this.logger.warn(`Invalid/Missing API Key. Falling back to Mock.`);
            return this.getMockResponse(content, business);
        }

        try {
            const client = this.getClient(apiKey);
            const model = this.getModelName(apiKey);

            this.logger.log(`Calling ${model}...`);

            const prompt = `
        You are an AI employee for "${business?.name || 'this business'}".
        
        KNOWLEDGE BASE:
        ${contextInfo}

        BEHAVIOR INSTRUCTIONS:
        ${customInstructions}

        Analyze this customer message: "${content}"
        
        AVAILABLE INTENTS: 
        - schedule_meeting, get_pricing, general_inquiry, complaint, human_agent

        Return ONLY a JSON object:
        {
          "intent": "string",
          "confidence": number,
          "suggested_reply": "your response here",
          "entities": {}
        }
      `;

            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a professional AI assistant. Respond in Urdu/English/Roman Urdu as needed. Output ONLY JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
            });

            const aiResponseContent = response.choices[0].message.content || '{}';
            this.logger.log(`AI Raw Output: ${aiResponseContent.substring(0, 50)}...`);

            const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : aiResponseContent;

            const result = JSON.parse(cleanJson);
            this.logger.log(`AI Analysis SUCCESS -> Intent: ${result.intent}`);
            return result;

        } catch (error) {
            this.logger.error(`AI API ERROR: ${error.message}`);
            return {
                intent: 'unknown',
                confidence: 0,
                suggested_reply: "I've received your message and am processing it. 🤖",
                entities: {},
            };
        }
    }

    private getMockResponse(content: string, business: any) {
        let intent = 'general_inquiry';
        let reply = "Hello! How can I assist you today?";
        const lowercaseContent = content.toLowerCase();

        if (lowercaseContent.includes('meeting') || lowercaseContent.includes('schedule')) {
            intent = 'schedule_meeting';
            reply = "I can help you schedule a visit. When works for you?";
        } else if (lowercaseContent.includes('price') || lowercaseContent.includes('apart') || lowercaseContent.includes('karti')) {
            intent = 'get_pricing';
            reply = business?.knowledgeBase
                ? `Details: ${business.knowledgeBase.substring(0, 150)}...`
                : "What details would you like to know about our services?";
        }

        return { intent, confidence: 0.9, suggested_reply: reply, entities: {} };
    }
}
