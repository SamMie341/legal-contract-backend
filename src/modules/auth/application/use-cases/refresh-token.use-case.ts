import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as authUserRepositoryInterface from '../../domain/repositories/auth-user.repository.interface.js';
import { getAccessibleModules, getPermissionsByModule } from '../../../../core/utils/division-helper.util.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';

@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
        private readonly jwtService: JwtService,
        private readonly tokenVersionService: TokenVersionService,
    ) { }

    async execute(dto: RefreshTokenDto) {
        let payload: any;
        try {
            payload = this.jwtService.verify(dto.refreshToken);
        } catch {
            throw new UnauthorizedException('Refresh Token ໝົດອາຍຸ ຫຼື ບໍ່ຖືກຕ້ອງ');
        }

        if (!payload || payload.type !== 'refresh' || !payload.sub) {
            throw new UnauthorizedException('Refresh Token ບໍ່ຖືກຕ້ອງ');
        }

        // 1. ດຶງຂໍ້ມູນ User ພ້ອມ Role ແລະ Permissions ໃໝ່ລ່າສຸດຈາກ Database
        const user = await this.authUserRepository.findByIdWithPermissions(payload.sub);

        if (!user || !user.isActive || user.deletedAt) {
            throw new UnauthorizedException('ບັນຊີຂອງທ່ານຖືກລະງັບ ຫຼື ຖືກລົບແລ້ວ');
        }

        // 2. ກວດສອບ Refresh Token ທີ່ເກັບໃນ Database (Token revocation check)
        if (user.refreshToken && user.refreshToken !== dto.refreshToken) {
            throw new UnauthorizedException('Refresh Token ຖືກຍົກເລີກແລ້ວ');
        }

        // 3. ຄຳນວນສິດໃໝ່ລ່າສຸດທັນທີ
        const roleName = user.roleRef?.name || user.role;
        const accessibleModules = getAccessibleModules(user);
        const permissionsByModule = getPermissionsByModule(user);
        const tokenVersion = user.tokenVersion ?? 1;

        // ອັບເດດ cache version ໃໝ່
        this.tokenVersionService.setVersion(user.id, tokenVersion);

        // 4. ອອກ Access Token ໃໝ່ ບັນຈຸສິດໃໝ່ລ່າສຸດ 100%
        const accessPayload = {
            sub: user.id,
            empCode: user.employeeCode,
            username: user.username,
            fullName: user.fullName,
            role: roleName,
            roleId: user.roleId,
            roleTitle: user.roleRef?.title,
            department: user.department,
            division: user.division,
            unit: user.unit,
            position: user.position,
            tokenVersion,
            accessibleModules,
            permissionsByModule,
        };
        const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '8h' });

        // 5. Rotated Refresh Token ໃໝ່
        const refreshPayload = {
            sub: user.id,
            tokenVersion,
            type: 'refresh',
        };
        const newRefreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });
        await this.authUserRepository.updateRefreshToken(user.id, newRefreshToken);

        return {
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                employeeCode: user.employeeCode,
                fullName: user.fullName,
                role: roleName,
                roleId: user.roleId,
                roleTitle: user.roleRef?.title,
                canView: user.canView,
                canUpload: user.canUpload,
                canEdit: user.canEdit,
                canDelete: user.canDelete,
                canDownload: user.canDownload,
                department: user.department,
                division: user.division,
                unit: user.unit,
                accessibleModules,
                permissionsByModule,
            },
        };
    }
}
