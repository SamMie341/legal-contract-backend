import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';

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
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenVersionService: TokenVersionService,
    ) {
        super({
            jwtFromRequest: extractJwtFromAny,
            ignoreExpiration: false, // ປະຕິເສດ Token ທີ່ໝົດອາຍຸ
            secretOrKey: process.env.JWT_SECRET || 'super_secret_key_legal_contract_management_system_2026',
        });
    }

    // ຟັງຊັນນີ້ຈະເຮັດວຽກເມື່ອ Token ຖືກຕ້ອງ - Pure Stateless Validation (Zero DB Query)
    async validate(payload: any) {
        if (!payload || !payload.sub) {
            throw new UnauthorizedException('Token ບໍ່ຖືກຕ້ອງ (Invalid token payload)');
        }

        // 1. Fast Token Version Check ຜ່ານ Memory Cache (ລະດັບ Nanosecond)
        // ຫາກສິດທິ ຫຼື ບົດບາດຂອງ User ຖືກແກ້ໄຂ, tokenVersion ຈະບໍ່ກົງກັນ -> ແຈ້ງ TOKEN_OUTDATED
        if (payload.tokenVersion !== undefined) {
            const isValid = await this.tokenVersionService.isValid(payload.sub, payload.tokenVersion);
            if (!isValid) {
                throw new UnauthorizedException({
                    statusCode: 401,
                    code: 'TOKEN_OUTDATED',
                    message: 'ສິດທິຂອງທ່ານໄດ້ຮັບການປ່ຽນແປງ ກະລຸນາ Refresh Token (Permissions modified, token outdated)',
                });
            }
        }

        // 2. Pure Stateless: ຫາກໃນ Token ມີ Permissions ຄົບຖ້ວນແລ້ວ ໃຫ້ສົ່ງຄືນທັນທີ (0 DB Queries!)
        if (payload.permissionsByModule) {
            const modulePermissions = Object.entries(payload.permissionsByModule).map(([mod, perms]: [string, any]) => ({
                module: mod,
                canView: Boolean(perms?.canView),
                canUpload: Boolean(perms?.canUpload),
                canEdit: Boolean(perms?.canEdit),
                canDelete: Boolean(perms?.canDelete),
                canDownload: Boolean(perms?.canDownload),
            }));

            return {
                userId: payload.sub,
                id: payload.sub,
                empCode: payload.empCode,
                username: payload.username,
                fullName: payload.fullName,
                department: payload.department,
                division: payload.division,
                unit: payload.unit,
                position: payload.position,
                role: payload.role,
                roleId: payload.roleId,
                roleTitle: payload.roleTitle,
                accessibleModules: payload.accessibleModules || [],
                permissionsByModule: payload.permissionsByModule || {},
                modulePermissions,
                tokenVersion: payload.tokenVersion,
            };
        }

        // 3. Fallback ສຳລັບ Token ຮູບແບບເກົ່າ (Backward-Compatibility)
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
                roleId: true,
                roleRef: {
                    select: {
                        id: true,
                        name: true,
                        title: true,
                        permissions: {
                            select: {
                                module: true,
                                canView: true,
                                canUpload: true,
                                canEdit: true,
                                canDelete: true,
                                canDownload: true,
                            },
                        },
                    },
                },
                canView: true,
                canUpload: true,
                canEdit: true,
                canDelete: true,
                canDownload: true,
                isActive: true,
                deletedAt: true,
                modulePermissions: {
                    select: {
                        module: true,
                        canView: true,
                        canUpload: true,
                        canEdit: true,
                        canDelete: true,
                        canDownload: true,
                    },
                },
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
            role: user.roleRef?.name || user.role,
            roleId: user.roleId,
            roleRef: user.roleRef,
            canView: user.canView,
            canUpload: user.canUpload,
            canEdit: user.canEdit,
            canDelete: user.canDelete,
            canDownload: user.canDownload,
            modulePermissions: user.modulePermissions || [],
        };
    }
}
