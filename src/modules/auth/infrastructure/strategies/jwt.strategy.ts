import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';

const extractJwtFromAny = (req: any) => {
    if (!req) return null;
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.substring(7).trim();
    }
    if (req.query?.token) {
        return String(req.query.token);
    }
    try {
        const urlObj = new URL(req.url, 'http://localhost');
        const tokenParam = urlObj.searchParams.get('token');
        if (tokenParam) return tokenParam;
    } catch { }
    return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: extractJwtFromAny,
            ignoreExpiration: false, // ปฏิเสธ Token ที่หมดอายุ
            secretOrKey: process.env.JWT_SECRET || 'super_secret_key_legal_contract_management_system_2026',
        });
    }

    // ฟังก์ชันนี้จะทำงานเมื่อ Token ถูกต้อง คืนค่า Payload กลับไปแนบกับ Request
    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                employeeCode: true,
                username: true,
                fullName: true,
                department: true,
                division: true,
                unit: true,
                position: true,
                role: true,
                canView: true,
                canUpload: true,
                canEdit: true,
                canDelete: true,
                canDownload: true,
                isActive: true,
                deletedAt: true,
            },
        });

        if (!user || !user.isActive || user.deletedAt) {
            throw new UnauthorizedException('ຜູ້ໃຊ້ນີ້ບໍ່ມີໃນລະບົບ ຫຼື ຖືກລະງັບການນຳໃຊ້ (User inactive or not found)');
        }

        return {
            userId: user.id,
            id: user.id,
            empCode: user.employeeCode,
            username: user.username,
            fullName: user.fullName,
            department: user.department,
            division: user.division,
            unit: user.unit,
            position: user.position,
            role: user.role,
            canView: user.canView,
            canUpload: user.canUpload,
            canEdit: user.canEdit,
            canDelete: user.canDelete,
            canDownload: user.canDownload,
        };
    }
}
