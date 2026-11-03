import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from '../application/dto/login.dto.js';
import { RefreshTokenDto } from '../application/dto/refresh-token.dto.js';
import { LocalLoginUseCase } from '../application/use-cases/local-login.use-case.js';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case.js';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { getAccessibleModules, getPermissionsByModule } from '../../../core/utils/division-helper.util.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly localLoginUseCase: LocalLoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
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
        return {
            message: 'ດຶງຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດ',
            data: {
                ...user,
                accessibleModules: getAccessibleModules(user),
                permissionsByModule: getPermissionsByModule(user),
            },
        };
    }
}
