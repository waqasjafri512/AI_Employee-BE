import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { ActionsModule } from '../actions/actions.module';

@Module({
    imports: [ActionsModule],
    controllers: [ApprovalsController],
    providers: [ApprovalsService],
    exports: [ApprovalsService],
})
export class ApprovalsModule { }
