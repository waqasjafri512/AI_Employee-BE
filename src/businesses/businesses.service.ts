import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BusinessesService {
    constructor(private prisma: PrismaService) { }

    async getProfile(id: string) {
        const business = await this.prisma.business.findUnique({
            where: { id }
        }) as any;

        if (!business) throw new NotFoundException('Business not found');
        return business;
    }

    async updateProfile(id: string, data: { knowledgeBase?: string, aiInstructions?: string, name?: string }) {
        return this.prisma.business.update({
            where: { id },
            data
        });
    }
}
