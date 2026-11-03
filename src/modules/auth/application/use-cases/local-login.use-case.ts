import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto.js';
import * as bcrypt from 'bcrypt';
import * as authUserRepositoryInterface from '../../domain/repositories/auth-user.repository.interface.js';
import { getAccessibleModules, getPermissionsByModule } from '../../../../core/utils/division-helper.util.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';

@Injectable()
export class LocalLoginUseCase {
    constructor(
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
        private readonly jwtService: JwtService,
        private readonly tokenVersionService: TokenVersionService,
    ) { }

    async execute(dto: LoginDto) {
        // 1. ຄົ້ນຫາຜູ້ໃຊ້ໃນຖານຂໍ້ມູນ (ດ້ວຍ username ຫຼື ລະຫັດພະນັກງານ)
        const user = await this.authUserRepository.findByUsernameOrEmpCode(dto.username);

        if (!user) {
            throw new UnauthorizedException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ');
        }

        // 2. ກວດສອບລະຫັດຜ່ານດ້ວຍ bcrypt
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
        }

        if (!user.isActive || user.deletedAt) {
            throw new UnauthorizedException('ບັນຊີຂອງທ່ານຖືກລະງັບ ຫຼື ຖືກລົບແລ້ວ');
        }

        // 3. ອັບເດດເວລາເຂົ້າສູ່ລະບົບຫຼ້າສຸດ (Last Login)
        await this.authUserRepository.updateLastLogin(user.id);

        // 4. ຄຳນວນສິດ ແລະ Token Version
        const roleName = user.roleRef?.name || user.role;
        const accessibleModules = getAccessibleModules(user);
        const permissionsByModule = getPermissionsByModule(user);
        const tokenVersion = user.tokenVersion ?? 1;

        // Cache token version ໃນ Memory ສຳລັບ Pure Stateless Fast Check
        this.tokenVersionService.setVersion(user.id, tokenVersion);

        // 5. ສ້າງ Access Token (Pure Stateless - ເກັບສິດຄົບຖ້ວນໃນ Token)
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

        // 6. ສ້າງ Refresh Token (ອາຍຸ 7 ວັນ ສຳລັບ Auto-Refresh ເມື່ອສິດຖືກປ່ຽນ)
        const refreshPayload = {
            sub: user.id,
            tokenVersion,
            type: 'refresh',
        };
        const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

        // ບັນທຶກ Refresh Token ລົງ Database
        await this.authUserRepository.updateRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
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
            }
        };
    }
}
