import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginAndSyncHrmUseCase } from '../application/use-cases/login-and-sync-hrm.use-case.js';
import { LoginDto } from '../application/dto/login.dto.js';
import { LocalLoginUseCase } from '../application/use-cases/local-login.use-case.js';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginAndSyncHrmUseCase,
        private readonly localLoginUseCase: LocalLoginUseCase,
    ) { }

    @ApiOperation({ summary: 'Login ຜ່ານລະບົບ HRM ແລະ Sync ຂໍ້ມູນພະນັກງານ' })
    @Post('hrm-login')
    @HttpCode(HttpStatus.OK)
    async hrmLogin(@Body() loginDto: LoginDto) {
        return this.loginUseCase.execute(loginDto);
    }

    @ApiOperation({ summary: 'Local Login ສຳລັບບັນຊີທ້ອງຖິ່ນ (ເຊັ່ນ Admin)' })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async localLogin(@Body() loginDto: LoginDto) {
        return this.localLoginUseCase.execute(loginDto);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນໂປຣໄຟລ໌ ແລະ ສິດທິຂອງ User ທີ່ກຳລັງເຂົ້າສູ່ລະບົບ' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@CurrentUser() user: any) {
        return {
            message: 'ດຶງຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດ',
            data: user,
        };
    }
}
