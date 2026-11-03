import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemModule, UserRole } from '@prisma/client';
import { CreateRoleUseCase } from '../src/modules/roles/application/use-cases/create-role.use-case.js';
import { GetRolesUseCase } from '../src/modules/roles/application/use-cases/get-roles.use-case.js';
import { GetRoleByIdUseCase } from '../src/modules/roles/application/use-cases/get-role-by-id.use-case.js';
import { UpdateRoleUseCase } from '../src/modules/roles/application/use-cases/update-role.use-case.js';
import { DeleteRoleUseCase } from '../src/modules/roles/application/use-cases/delete-role.use-case.js';
import { canAccessModule } from '../src/core/utils/division-helper.util.js';
import { RolesGuard } from '../src/core/guards/roles.guard.js';

describe('RolesModule & Dynamic Custom Roles', () => {
    let mockRoleRepo: any;
    let createRoleUseCase: CreateRoleUseCase;
    let getRolesUseCase: GetRolesUseCase;
    let getRoleByIdUseCase: GetRoleByIdUseCase;
    let updateRoleUseCase: UpdateRoleUseCase;
    let deleteRoleUseCase: DeleteRoleUseCase;

    beforeEach(() => {
        mockRoleRepo = {
            createRole: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            findByName: vi.fn(),
            updateRole: vi.fn(),
            deleteRole: vi.fn(),
            countUsersByRoleId: vi.fn(),
        };

        createRoleUseCase = new CreateRoleUseCase(mockRoleRepo);
        getRolesUseCase = new GetRolesUseCase(mockRoleRepo);
        getRoleByIdUseCase = new GetRoleByIdUseCase(mockRoleRepo);
        updateRoleUseCase = new UpdateRoleUseCase(mockRoleRepo);
        deleteRoleUseCase = new DeleteRoleUseCase(mockRoleRepo);
    });

    describe('CreateRoleUseCase', () => {
        it('should create a custom role with permissions', async () => {
            const dto = {
                name: 'CONTRACT_AUDITOR',
                title: 'ຜູ້ກວດສອບສັນຍາ',
                description: 'ກວດສອບ ແລະ ດາວໂຫຼດສັນຍາ',
                permissions: [
                    {
                        module: SystemModule.CONTRACTS,
                        canView: true,
                        canUpload: false,
                        canEdit: false,
                        canDelete: false,
                        canDownload: true,
                    },
                ],
            };

            const createdRole = { id: 'role-1', ...dto, isSystem: false };
            mockRoleRepo.createRole.mockResolvedValue(createdRole);

            const result = await createRoleUseCase.execute(dto, 'admin-uuid');
            expect(result.message).toBe('ສ້າງບົດບາດໃໝ່ສຳເລັດ');
            expect(result.data.name).toBe('CONTRACT_AUDITOR');
            expect(mockRoleRepo.createRole).toHaveBeenCalledWith(dto, 'admin-uuid');
        });
    });

    describe('GetRolesUseCase & GetRoleByIdUseCase', () => {
        it('should return list of all roles', async () => {
            mockRoleRepo.findAll.mockResolvedValue([
                { id: '1', name: 'ADMIN', isSystem: true },
                { id: '2', name: 'CONTRACT_AUDITOR', isSystem: false },
            ]);

            const result = await getRolesUseCase.execute();
            expect(result.total).toBe(2);
            expect(result.data).toHaveLength(2);
        });

        it('should return single role by id', async () => {
            mockRoleRepo.findById.mockResolvedValue({ id: 'r1', name: 'ADMIN' });
            const result = await getRoleByIdUseCase.execute('r1');
            expect(result.data.name).toBe('ADMIN');
        });

        it('should throw NotFoundException if role does not exist', async () => {
            mockRoleRepo.findById.mockResolvedValue(null);
            await expect(getRoleByIdUseCase.execute('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('UpdateRoleUseCase & DeleteRoleUseCase', () => {
        it('should update role data and permissions', async () => {
            mockRoleRepo.updateRole.mockResolvedValue({ id: 'r1', title: 'Updated Title' });
            const result = await updateRoleUseCase.execute('r1', { title: 'Updated Title' }, 'admin-uuid');
            expect(result.data.title).toBe('Updated Title');
            expect(mockRoleRepo.updateRole).toHaveBeenCalledWith('r1', { title: 'Updated Title' }, 'admin-uuid');
        });

        it('should delete custom role when no users are assigned', async () => {
            mockRoleRepo.deleteRole.mockResolvedValue(undefined);
            const result = await deleteRoleUseCase.execute('r1', 'admin-uuid');
            expect(result.message).toBe('ລົບບົດບາດສຳເລັດ');
            expect(mockRoleRepo.deleteRole).toHaveBeenCalledWith('r1', 'admin-uuid');
        });
    });

    describe('Dynamic Permission Evaluation via canAccessModule', () => {
        it('should allow user with custom role to access permitted modules based on role permissions', () => {
            const userWithCustomRole = {
                id: 'u-custom',
                username: 'auditor01',
                division: 'ພະແນກກວດກາ',
                roleId: 'role-auditor',
                roleRef: {
                    id: 'role-auditor',
                    name: 'CONTRACT_AUDITOR',
                    title: 'ຜູ້ກວດສອບສັນຍາ',
                    permissions: [
                        {
                            module: SystemModule.CONTRACTS,
                            canView: true,
                            canUpload: false,
                            canEdit: false,
                            canDelete: false,
                            canDownload: true,
                        },
                        {
                            module: SystemModule.POWER_CONTRACTS,
                            canView: true,
                            canUpload: false,
                            canEdit: false,
                            canDelete: false,
                            canDownload: false,
                        },
                    ],
                },
            };

            // Contracts
            expect(canAccessModule(userWithCustomRole, SystemModule.CONTRACTS, 'canView')).toBe(true);
            expect(canAccessModule(userWithCustomRole, SystemModule.CONTRACTS, 'canDownload')).toBe(true);
            expect(canAccessModule(userWithCustomRole, SystemModule.CONTRACTS, 'canUpload')).toBe(false);
            expect(canAccessModule(userWithCustomRole, SystemModule.CONTRACTS, 'canDelete')).toBe(false);

            // Power Contracts
            expect(canAccessModule(userWithCustomRole, SystemModule.POWER_CONTRACTS, 'canView')).toBe(true);
            expect(canAccessModule(userWithCustomRole, SystemModule.POWER_CONTRACTS, 'canDownload')).toBe(false);

            // Legal Documents (not in custom role matrix)
            expect(canAccessModule(userWithCustomRole, SystemModule.LEGAL_DOCUMENTS, 'canView')).toBe(false);
        });

        it('user-specific modulePermissions should override role-level permissions (Hybrid)', () => {
            const userWithOverride = {
                id: 'u-override',
                roleRef: {
                    id: 'role-viewer',
                    name: 'VIEWER',
                    permissions: [
                        {
                            module: SystemModule.CONTRACTS,
                            canView: true,
                            canUpload: false,
                        },
                    ],
                },
                // User has explicit override granting canUpload in CONTRACTS
                modulePermissions: [
                    {
                        module: SystemModule.CONTRACTS,
                        canView: true,
                        canUpload: true,
                    },
                ],
            };

            // Without override, viewer cannot upload; with override, canUpload is true!
            expect(canAccessModule(userWithOverride, SystemModule.CONTRACTS, 'canUpload')).toBe(true);
        });
    });

    describe('RolesGuard with Dynamic / Custom Roles', () => {
        let reflector: Reflector;
        let guard: RolesGuard;

        const createMockContext = (user: any): ExecutionContext => {
            return {
                getHandler: vi.fn(),
                getClass: vi.fn(),
                switchToHttp: () => ({
                    getRequest: () => ({ user }),
                }),
            } as unknown as ExecutionContext;
        };

        beforeEach(() => {
            reflector = new Reflector();
            guard = new RolesGuard(reflector);
        });

        it('should allow access when user role matches required role', () => {
            vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
            const context = createMockContext({
                role: 'ADMIN',
                roleRef: { name: 'ADMIN' },
            });
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should throw ForbiddenException when user does not have required role', () => {
            vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
            const context = createMockContext({
                role: 'VIEWER',
                roleRef: { name: 'VIEWER' },
            });
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
    });
});
