import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getStats(@Request() req: any) {
        return this.dashboardService.getStats(req.user.businessId);
    }

    @Get('engagement')
    async getEngagement(@Request() req: any) {
        return this.dashboardService.getEngagement(req.user.businessId);
    }

    @Get('search')
    async search(@Request() req: any, @Query('q') query: string) {
        return this.dashboardService.search(req.user.businessId, query);
    }

    @Get('export')
    async exportLogs(@Request() req: any) {
        return this.dashboardService.exportLogs(req.user.businessId);
    }
}
