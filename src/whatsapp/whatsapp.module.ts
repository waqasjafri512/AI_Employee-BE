import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { AiModule } from '../ai/ai.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [AiModule, ConversationsModule, WorkflowsModule, ApprovalsModule, ActionsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule { }
