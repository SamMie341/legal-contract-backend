import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenVersionService } from '../src/core/services/token-version.service.js';
import { JwtStrategy } from '../src/modules/auth/infrastructure/strategies/jwt.strategy.js';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case.js';
import { UnauthorizedException } from '@nestjs/common';

describe('Token Versioning & Refresh Token System (Pure Stateless Auto-Invalidation)', () => {
    let prismaMock: any;
    let tokenVersionService: TokenVersionService;
    let jwtServiceMock: any;
    let authUserRepoMock: any;

    beforeEach(() => {
        prismaMock = {
            user: {
                findUnique: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
        };
        tokenVersionService = new TokenVersionService(prismaMock);

        jwtServiceMock = {
            sign: vi.fn().mockReturnValue('mock_jwt_token'),
            verify: vi.fn(),
        };

        authUserRepoMock = {
            findByIdWithPermissions: vi.fn(),
            updateRefreshToken: vi.fn(),
        };
    });

    describe('TokenVersionService', () => {
        it('should fetch from DB on cache miss and cache the version in-memory', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ tokenVersion: 3 });

            const v1 = await tokenVersionService.getVersion('user-1');
            expect(v1).toBe(3);
            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);

            // Second call: in-memory cache hit (zero DB query)
            const v2 = await tokenVersionService.getVersion('user-1');
            expect(v2).toBe(3);
            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
        });

        it('should invalidate a user token by incrementing DB and updating cache', async () => {
            prismaMock.user.update.mockResolvedValue({ tokenVersion: 4 });

            const newVer = await tokenVersionService.invalidateUser('user-1');
            expect(newVer).toBe(4);
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { tokenVersion: { increment: 1 } },
                select: { tokenVersion: true },
            });

            // Cache is now 4
            const cached = await tokenVersionService.getVersion('user-1');
            expect(cached).toBe(4);
        });

        it('should invalidate all users holding a role by clearing cache and updating DB', async () => {
            tokenVersionService.setVersion('user-1', 2);
            tokenVersionService.setVersion('user-2', 5);

            await tokenVersionService.invalidateRole('role-uuid');
            expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
                where: { roleId: 'role-uuid', deletedAt: null },
                data: { tokenVersion: { increment: 1 } },
            });

            // After cache clear, next getVersion will fetch fresh from DB
            prismaMock.user.findUnique.mockResolvedValue({ tokenVersion: 6 });
            const v = await tokenVersionService.getVersion('user-1');
            expect(v).toBe(6);
            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
        });

        it('should validate whether a tokenVersion is up to date', async () => {
            tokenVersionService.setVersion('user-1', 5);

            expect(await tokenVersionService.isValid('user-1', 5)).toBe(true);
            expect(await tokenVersionService.isValid('user-1', 4)).toBe(false);
            expect(await tokenVersionService.isValid('user-1', undefined)).toBe(false);
        });
    });

    describe('JwtStrategy (Pure Stateless + Auto-Invalidation Check)', () => {
        let strategy: JwtStrategy;

        beforeEach(() => {
            strategy = new JwtStrategy(prismaMock, tokenVersionService);
        });

        it('should validate stateless payload directly without querying database when tokenVersion matches', async () => {
            tokenVersionService.setVersion('user-1', 1);

            const payload = {
                sub: 'user-1',
                empCode: 'EDL-001',
                username: 'admin',
                fullName: 'Super Admin',
                role: 'ADMIN',
                tokenVersion: 1,
                permissionsByModule: {
                    CONTRACTS: { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
                },
            };

            const user = await strategy.validate(payload);
            expect(user.userId).toBe('user-1');
            expect(user.role).toBe('ADMIN');
            expect(user.permissionsByModule.CONTRACTS.canView).toBe(true);

            // Database was NOT queried! (Pure Stateless)
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });

        it('should throw TOKEN_OUTDATED 401 when tokenVersion does not match current user version', async () => {
            // User permissions were changed, version bumped to 2
            tokenVersionService.setVersion('user-1', 2);

            const oldPayload = {
                sub: 'user-1',
                tokenVersion: 1, // Stale token!
                permissionsByModule: {},
            };

            await expect(strategy.validate(oldPayload)).rejects.toThrow(UnauthorizedException);
            try {
                await strategy.validate(oldPayload);
            } catch (err: any) {
                expect(err.response?.code).toBe('TOKEN_OUTDATED');
            }
        });
    });

    describe('RefreshTokenUseCase', () => {
        let useCase: RefreshTokenUseCase;

        beforeEach(() => {
            useCase = new RefreshTokenUseCase(
                authUserRepoMock,
                jwtServiceMock,
                tokenVersionService,
            );
        });

        it('should refresh token successfully and issue fresh access token with updated permissions', async () => {
            jwtServiceMock.verify.mockReturnValue({
                sub: 'user-1',
                tokenVersion: 2,
                type: 'refresh',
            });

            authUserRepoMock.findByIdWithPermissions.mockResolvedValue({
                id: 'user-1',
                employeeCode: 'EDL-001',
                username: 'somchai',
                fullName: 'Somchai',
                role: 'MAIN_USER',
                roleId: 'role-1',
                roleRef: {
                    name: 'MAIN_USER',
                    title: 'ຜູ້ໃຊ້ຫຼັກ',
                    permissions: [],
                },
                division: 'ພະແນກສັນຍາທົ່ວໄປ',
                tokenVersion: 2,
                refreshToken: 'valid-refresh-token',
                isActive: true,
                deletedAt: null,
            });

            const result = await useCase.execute({ refreshToken: 'valid-refresh-token' });
            expect(result.accessToken).toBe('mock_jwt_token');
            expect(result.refreshToken).toBe('mock_jwt_token');
            expect(result.user.employeeCode).toBe('EDL-001');
            expect(result.user.permissionsByModule.CONTRACTS.canView).toBe(true);
            expect(authUserMockSavedRefreshToken()).toBe(true);

            function authUserMockSavedRefreshToken() {
                return authUserRepoMock.updateRefreshToken.mock.calls.length > 0;
            }
        });

        it('should reject invalid or revoked refresh token', async () => {
            jwtServiceMock.verify.mockImplementation(() => {
                throw new Error('Token expired');
            });

            await expect(useCase.execute({ refreshToken: 'expired-token' })).rejects.toThrow(UnauthorizedException);
        });
    });
});
