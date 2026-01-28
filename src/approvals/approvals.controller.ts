import { Controller, Get, Patch, Param, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ActionsService } from '../actions/actions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
    private readonly logger = new Logger(ApprovalsController.name);

    constructor(
        private readonly approvalsService: ApprovalsService,
        private readonly actionsService: ActionsService,
    ) { }

    @Get('pending')
    async getPending(@Request() req: any) {
        return this.approvalsService.getPendingApprovals(req.user.businessId);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: 'APPROVED' | 'REJECTED',
        @Request() req: any,
    ) {
        this.logger.log(`User ${req.user.email} updating approval ${id} to status: ${status}`);

        // Ensure approval belongs to the business
        const updatedApproval = await this.approvalsService.updateApprovalStatus(
            id,
            status,
            req.user.userId,
            req.user.businessId
        );

        if (status === 'APPROVED') {
            // Trigger async execution
            this.actionsService.executeAction(id).catch(err => {
                this.logger.error(`Async execution failed for ${id}`, err);
            });
        }

        return updatedApproval;
    }
}
