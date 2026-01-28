import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signup(data: any) {
        const { email, password, name, businessName } = data;

        // 1. Check if user exists
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ConflictException('Email already registered');

        // 2. Create Business
        const business = await this.prisma.business.create({
            data: { name: businessName },
        });

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create User
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                businessId: business.id,
                role: 'admin',
            },
            include: { business: true }
        });

        // 5. Generate Token
        return this.generateToken(user);
    }

    async login(data: any) {
        const { email, password } = data;

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { business: true }
        });

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            businessId: user.businessId,
            businessName: user.business.name
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                businessId: user.businessId,
                businessName: user.business.name
            }
        };
    }
}
