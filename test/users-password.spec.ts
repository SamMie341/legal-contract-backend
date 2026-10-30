import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { NotFoundException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { ResetPasswordUseCase } from '../src/modules/users/application/use-cases/reset-password.use-case.js';
import { ChangePasswordUseCase } from '../src/modules/users/application/use-cases/change-password.use-case.js';
import { IUserRepository } from '../src/modules/users/domain/repositories/user.repository.interface.js';
import { resolveModuleFromPath } from '../src/core/utils/division-helper.util.js';
import { DivisionGuard } from '../src/core/guards/division.guard.js';
import { Division } from '../src/core/constants/division.constant.js';

describe('Users Password Management (ການຣີເຊັດ ແລະ ປ່ຽນລະຫັດຜ່ານ)', () => {
    let mockUserRepo: Partial<IUserRepository>;
    let resetPasswordUseCase: ResetPasswordUseCase;
    let changePasswordUseCase: ChangePasswordUseCase;

    const mockAdminId = 'admin-uuid-001';
    const mockUserId = 'user-uuid-123';
    const originalPassword = 'OldPassword@123';

    beforeEach(async () => {
        const hashedPassword = await bcrypt.hash(originalPassword, 10);

        mockUserRepo = {
            findUserWithPassword: vi.fn().mockImplementation(async (id: string) => {
                if (id === mockUserId) {
                    return {
                        id: mockUserId,
                        employeeCode: '44652',
                        username: '44652',
                        email: '44652@edl.com.la',
                        fullName: 'Somxay Thammavong',
                        passwordHash: hashedPassword,
                        role: UserRole.MAIN_USER,
                        division: Division.GENERAL_CONTRACT,
                        isActive: true,
                        deletedAt: null,
                    };
                }
                return null;
            }),
            updatePasswordWithAudit: vi.fn().mockResolvedValue(undefined),
        };

        resetPasswordUseCase = new ResetPasswordUseCase(mockUserRepo as IUserRepository);
        changePasswordUseCase = new ChangePasswordUseCase(mockUserRepo as IUserRepository);
    });

    describe('ResetPasswordUseCase (Admin Reset Password)', () => {
        it('Admin should be able to reset password with custom new password', async () => {
            const dto = { newPassword: 'NewCustomPass@2026' };
            const result = await resetPasswordUseCase.execute(mockUserId, dto, mockAdminId);

            expect(result.message).toContain('ຣີເຊັດລະຫັດຜ່ານສຳເລັດ');
            expect(result.data.userId).toBe(mockUserId);
            expect(result.data.temporaryPassword).toBe('NewCustomPass@2026');

            expect(mockUserRepo.updatePasswordWithAudit).toHaveBeenCalledWith(
                mockUserId,
                expect.any(String),
                mockAdminId,
                'RESET_BY_ADMIN',
            );

            // Verify the stored hash matches the new password
            const passedHash = (mockUserRepo.updatePasswordWithAudit as any).mock.calls[0][1];
            const isValid = await bcrypt.compare('NewCustomPass@2026', passedHash);
            expect(isValid).toBe(true);
        });

        it('Admin should be able to reset password without specifying password (fallback to EDL@{empCode})', async () => {
            const dto = {};
            const result = await resetPasswordUseCase.execute(mockUserId, dto, mockAdminId);

            expect(result.message).toContain('ຣີເຊັດລະຫັດຜ່ານສຳເລັດ');
            expect(result.data.temporaryPassword).toBe('EDL@44652');

            expect(mockUserRepo.updatePasswordWithAudit).toHaveBeenCalledWith(
                mockUserId,
                expect.any(String),
                mockAdminId,
                'RESET_BY_ADMIN',
            );

            const passedHash = (mockUserRepo.updatePasswordWithAudit as any).mock.calls[0][1];
            const isValid = await bcrypt.compare('EDL@44652', passedHash);
            expect(isValid).toBe(true);
        });

        it('Should throw NotFoundException if target user does not exist', async () => {
            await expect(
                resetPasswordUseCase.execute('non-existent-id', {}, mockAdminId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('ChangePasswordUseCase (User Changes Own Password)', () => {
        it('User should successfully change password with valid current and new password', async () => {
            const dto = {
                currentPassword: originalPassword,
                newPassword: 'BrandNewPassword@2026',
                confirmPassword: 'BrandNewPassword@2026',
            };

            const result = await changePasswordUseCase.execute(mockUserId, dto);

            expect(result.message).toContain('ປ່ຽນລະຫັດຜ່ານສຳເລັດ');
            expect(result.data.userId).toBe(mockUserId);

            expect(mockUserRepo.updatePasswordWithAudit).toHaveBeenCalledWith(
                mockUserId,
                expect.any(String),
                mockUserId,
                'CHANGED_BY_SELF',
            );

            const passedHash = (mockUserRepo.updatePasswordWithAudit as any).mock.calls[0][1];
            const isValid = await bcrypt.compare('BrandNewPassword@2026', passedHash);
            expect(isValid).toBe(true);
        });

        it('Should reject if currentPassword is incorrect', async () => {
            const dto = {
                currentPassword: 'WrongCurrentPassword',
                newPassword: 'BrandNewPassword@2026',
            };

            await expect(changePasswordUseCase.execute(mockUserId, dto)).rejects.toThrow(BadRequestException);
        });

        it('Should reject if newPassword is the same as current password', async () => {
            const dto = {
                currentPassword: originalPassword,
                newPassword: originalPassword,
            };

            await expect(changePasswordUseCase.execute(mockUserId, dto)).rejects.toThrow(BadRequestException);
        });

        it('Should reject if confirmPassword does not match newPassword', async () => {
            const dto = {
                currentPassword: originalPassword,
                newPassword: 'BrandNewPassword@2026',
                confirmPassword: 'DifferentPassword@2026',
            };

            await expect(changePasswordUseCase.execute(mockUserId, dto)).rejects.toThrow(BadRequestException);
        });

        it('Should throw NotFoundException if user is not found or inactive', async () => {
            const dto = {
                currentPassword: originalPassword,
                newPassword: 'BrandNewPassword@2026',
            };

            await expect(changePasswordUseCase.execute('non-existent-user', dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('DivisionGuard & URL Resolution for Self-Service change-password', () => {
        it('resolveModuleFromPath should return null for /users/change-password so it is accessible to all users', () => {
            expect(resolveModuleFromPath('/users/change-password')).toBeNull();
            expect(resolveModuleFromPath('/api/users/change-password')).toBeNull();
            expect(resolveModuleFromPath('/api/v1/users/change-password')).toBeNull();
        });

        it('DivisionGuard should allow non-admin user to access change-password without being blocked', () => {
            const reflector = new Reflector();
            const guard = new DivisionGuard(reflector);

            vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null as any);

            const context = {
                getHandler: vi.fn(),
                getClass: vi.fn(),
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: {
                            userId: mockUserId,
                            role: UserRole.MAIN_USER,
                            division: Division.GENERAL_CONTRACT,
                        },
                        originalUrl: '/users/change-password',
                        method: 'PATCH',
                    }),
                }),
            } as unknown as ExecutionContext;

            expect(guard.canActivate(context)).toBe(true);
        });
    });
});
