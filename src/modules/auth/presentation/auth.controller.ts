import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from '../application/dto/login.dto.js';
import { RefreshTokenDto } from '../application/dto/refresh-token.dto.js';
import { LocalLoginUseCase } from '../application/use-cases/local-login.use-case.js';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case.js';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { getAccessibleModules, getPermissionsByModule } from '../../../core/utils/division-helper.util.js';
import * as authUserRepositoryInterface from '../domain/repositories/auth-user.repository.interface.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly localLoginUseCase: LocalLoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
    ) { }

    @ApiOperation({ summary: 'ເຂົ້າສູ່ລະບົບ (Login ຜ່ານບັນຊີຜູ້ໃຊ້ໃນລະບົບ)' })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async localLogin(@Body() loginDto: LoginDto) {
        return this.localLoginUseCase.execute(loginDto);
    }

    @ApiOperation({ summary: 'ຕໍ່ອາຍຸ ແລະ ດຶງສິດໃໝ່ລ່າສຸດດ້ວຍ Refresh Token (Refresh Token & Permissions)' })
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.refreshTokenUseCase.execute(dto);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນໂປຣໄຟລ໌ ແລະ ສິດທິຂອງ User ທີ່ກຳລັງເຂົ້າສູ່ລະບົບ' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@CurrentUser() user: any) {
        const userId = user?.userId || user?.id;
        const freshUser = userId ? await this.authUserRepository.findByIdWithPermissions(userId) : null;
        const targetUser = freshUser || user;
        const roleName = targetUser.roleRef?.name || targetUser.role;

        return {
            message: 'ດຶງຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດ',
            data: {
                id: targetUser.id,
                userId: targetUser.id,
                employeeCode: targetUser.employeeCode,
                username: targetUser.username,
                fullName: targetUser.fullName,
                department: targetUser.department,
                division: targetUser.division,
                unit: targetUser.unit,
                position: targetUser.position,
                email: targetUser.email,
                phone: targetUser.phone,
                role: roleName,
                roleId: targetUser.roleId,
                roleTitle: targetUser.roleRef?.title,
                canView: targetUser.canView,
                canUpload: targetUser.canUpload,
                canEdit: targetUser.canEdit,
                canDelete: targetUser.canDelete,
                canDownload: targetUser.canDownload,
                accessibleModules: getAccessibleModules(targetUser),
                permissionsByModule: getPermissionsByModule(targetUser),
                modulePermissions: targetUser.modulePermissions || [],
            },
        };
    }
}
