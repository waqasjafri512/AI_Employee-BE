import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessesController {
    constructor(private readonly itemsService: BusinessesService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        return this.itemsService.getProfile(req.user.businessId);
    }

    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() body: any) {
        return this.itemsService.updateProfile(req.user.businessId, body);
    }
}
