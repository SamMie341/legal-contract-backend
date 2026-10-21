import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './presentation/auth.controller.js';
import { HrmApiService } from './infrastructure/hrm/hrm-api.service.js';
import { LoginAndSyncHrmUseCase } from './application/use-cases/login-and-sync-hrm.use-case.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { LocalLoginUseCase } from './application/use-cases/local-login.use-case.js';
import { AUTH_USER_REPOSITORY } from './domain/repositories/auth-user.repository.interface.js';
import { AuthUserRepository } from './infrastructure/auth-user.repository.js';
import { ConfigService } from '@nestjs/config';
import { HRM_API_SERVICE } from './domain/interface/hrm-api.interface.js';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET') || 'super_secret_key_legal_contract_management_system_2026',
                signOptions: { expiresIn: '8h' },
            })
        })
    ],
    controllers: [AuthController],
    providers: [
        HrmApiService,
        LoginAndSyncHrmUseCase,
        LocalLoginUseCase,
        JwtStrategy,
        {
            provide: AUTH_USER_REPOSITORY,
            useClass: AuthUserRepository,
        },
        {
            provide: HRM_API_SERVICE,
            useClass: HrmApiService,
        }
    ],
    exports: [HRM_API_SERVICE],
})
export class AuthModule { }
