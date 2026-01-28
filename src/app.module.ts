import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { UsersModule } from './users/users.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConversationsModule } from './conversations/conversations.module';
import { IntentsModule } from './intents/intents.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ActionsModule } from './actions/actions.module';
import { AiModule } from './ai/ai.module';
import { LogsModule } from './logs/logs.module';
import { PrismaModule } from './prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BusinessesModule,
    UsersModule,
    WhatsappModule,
    ConversationsModule,
    IntentsModule,
    WorkflowsModule,
    ApprovalsModule,
    ActionsModule,
    AiModule,
    LogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
