import { Controller, Get, Post, Body, Query, Res, HttpStatus, Logger, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('whatsapp')
export class WhatsappController {
    private readonly logger = new Logger(WhatsappController.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly whatsappService: WhatsappService,
    ) { }

    @Get('webhook')
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
        @Res() res: Response,
    ) {
        const MY_VERIFY_TOKEN = this.configService.get<string>('WEBHOOK_VERIFY_TOKEN') || 'my_secret_token';

        if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
            this.logger.log('Webhook Verified!');
            return res.status(HttpStatus.OK).send(challenge);
        }

        this.logger.error(`Webhook Verification Failed. Token received: ${token}`);
        return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
    }

    @Post('webhook')
    async handleMessage(@Body() body: any, @Res() res: Response) {
        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            if (!message) {
                return res.status(HttpStatus.OK).send('NOT_A_MESSAGE');
            }

            const from = message.from;
            const text = message.text?.body;

            if (!text) {
                return res.status(HttpStatus.OK).send('NO_TEXT_CONTENT');
            }

            // In production, you would map the metadata.phone_number_id or from to a businessId
            // For now, we use the dev-business-id for real webhooks
            const result = await this.whatsappService.processMessage(from, text, 'dev-business-id');
            return res.status(HttpStatus.OK).json(result);
        } catch (error) {
            this.logger.error('Webhook processing failed critically!', error.stack || error);
            return res.status(HttpStatus.OK).json({ error: error.message });
        }
    }

    // SIMULATOR ENDPOINT - Now secured to map to the correct business
    @Post('simulate')
    @UseGuards(JwtAuthGuard)
    async simulateMessage(
        @Body() body: { from: string; text: string },
        @Request() req: any,
        @Res() res: Response
    ) {
        try {
            this.logger.log(`SIMULATION START: Business "${req.user.businessId}" by "${req.user.email}" | Text: "${body.text}"`);
            const result = await this.whatsappService.processMessage(
                body.from,
                body.text,
                req.user.businessId
            );
            this.logger.log(`SIMULATION COMPLETE: Success! Result intent: ${result.analysis?.intent}`);
            return res.status(HttpStatus.OK).json({
                ...result,
                mode: 'SIMULATED'
            });
        } catch (error) {
            this.logger.error(`SIMULATION FAILED: ${error.message}`, error.stack);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}
