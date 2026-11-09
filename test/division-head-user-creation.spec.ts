import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, SystemModule as PrismaSystemModule } from '@prisma/client';
import { Division, SystemModule } from '../src/core/constants/division.constant.js';
import {
    isSameDivision,
    isSameDepartment,
    isSameDivisionAndDepartment,
    canAccessModule,
} from '../src/core/utils/division-helper.util.js';
import { CreateUserUseCase } from '../src/modules/users/application/use-cases/create-user.use-case.js';
import { GetHrmEmployeeUseCase } from '../src/modules/users/application/use-cases/get-hrm-employee.use-case.js';
import { ForbiddenException, ConflictException } from '@nestjs/common';

describe('DIVISION_HEAD User Management & Division Boundaries', () => {
    describe('Division & Department Matchers', () => {
        it('should match exact and normalized divisions with whitespace/vowels', () => {
            expect(isSameDivision('ພະແນກສັນຍາທົ່ວໄປ', ' ພະແນກສັນຍາທົ່ວໄປ ')).toBe(true);
            expect(isSameDivision('ພະແນກນິຕິກໍາ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ', 'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ')).toBe(true);
        });

        it('should match divisions within the same domain category', () => {
            expect(isSameDivision('ພະແນກສັນຍາທົ່ວໄປ', 'ພະແນກສັນຍາທົ່ວໄປ ຟຟລ')).toBe(true);
            expect(isSameDivision('ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ', 'ພະແນກສັນຍາຊື້ຂາຍໄຟ')).toBe(true);
            expect(isSameDivision('ພະແນກນິຕິກຳ', 'ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ')).toBe(true);
        });

        it('should reject different divisions', () => {
            expect(isSameDivision('ພະແນກສັນຍາທົ່ວໄປ', 'ພະແນກສັນຍາຊື້-ຂายໄຟຟ້າ')).toBe(false);
            expect(isSameDivision('ພະແນກສັນຍາທົ່ວໄປ', 'ພະແນກນິຕິກຳ')).toBe(false);
            expect(isSameDivision('ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ', 'ພະແນກນິຕິກຳ')).toBe(false);
        });

        it('should validate composite division and department correctly', () => {
            const actor = { division: 'ພະແນກສັນຍາທົ່ວໄປ', department: 'ຝ່າຍກົດໝາຍ' };

            // Same division, same department -> true
            expect(isSameDivisionAndDepartment(actor, {
                division: ' ພະແນກສັນຍາທົ່ວໄປ ',
                department: 'ຝ່າຍກົດໝາຍ',
            })).toBe(true);

            // Same division, DIFFERENT department -> false!
            expect(isSameDivisionAndDepartment(actor, {
                division: 'ພະແນກສັນຍາທົ່ວໄປ',
                department: 'ຝ່າຍການເງິນ',
            })).toBe(false);

            // Different division, same department -> false!
            expect(isSameDivisionAndDepartment(actor, {
                division: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
                department: 'ຝ່າຍກົດໝາຍ',
            })).toBe(false);
        });
    });

    describe('canAccessModule for SystemModule.USERS', () => {
        const divisionHead = { role: UserRole.DIVISION_HEAD, division: Division.GENERAL_CONTRACT };
        const adminUser = { role: UserRole.ADMIN };
        const mainUser = { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT };
        const viewerUser = { role: UserRole.VIEWER };

        it('DIVISION_HEAD can view, upload, and edit in USERS module, but cannot delete', () => {
            expect(canAccessModule(divisionHead, SystemModule.USERS, 'canView')).toBe(true);
            expect(canAccessModule(divisionHead, SystemModule.USERS, 'canUpload')).toBe(true);
            expect(canAccessModule(divisionHead, SystemModule.USERS, 'canEdit')).toBe(true);
            expect(canAccessModule(divisionHead, SystemModule.USERS, 'canDelete')).toBe(false);
        });

        it('ADMIN can perform all actions in USERS module', () => {
            expect(canAccessModule(adminUser, SystemModule.USERS, 'canView')).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.USERS, 'canUpload')).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.USERS, 'canDelete')).toBe(true);
        });

        it('MAIN_USER and VIEWER cannot access USERS module', () => {
            expect(canAccessModule(mainUser, SystemModule.USERS, 'canView')).toBe(false);
            expect(canAccessModule(viewerUser, SystemModule.USERS, 'canView')).toBe(false);
        });
    });

    describe('CreateUserUseCase security checks for DIVISION_HEAD', () => {
        let createUserUseCase: CreateUserUseCase;
        let mockUserRepo: any;
        let mockHrmApi: any;
        let mockConfigService: any;

        const divisionHeadUser = {
            userId: 'div-head-uuid',
            role: UserRole.DIVISION_HEAD,
            division: 'ພະແນກສັນຍາທົ່ວໄປ',
            department: 'ຝ່າຍກົດໝາຍ',
        };

        beforeEach(() => {
            mockUserRepo = {
                findByEmployeeCode: vi.fn().mockResolvedValue(null),
                createOrRestoreFromHrm: vi.fn().mockImplementation((data, creatorId) => Promise.resolve({ id: 'new-user-uuid', ...data })),
            };

            mockHrmApi = {
                login: vi.fn().mockResolvedValue('fake-hrm-token'),
                getEmployeeByCode: vi.fn(),
            };

            mockConfigService = {
                get: vi.fn((key: string) => {
                    if (key === 'HRM_SYNC_USERNAME') return 'Ton';
                    if (key === 'HRM_SYNC_PASSWORD') return 'HRM1234';
                    return null;
                }),
            };

            createUserUseCase = new CreateUserUseCase(mockUserRepo, mockHrmApi, mockConfigService);
        });

        it('should allow DIVISION_HEAD to add employee belonging to the SAME division and department', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-101',
                first_name_la: 'ສົມສັກ',
                last_name_la: 'ສີສຸວັນ',
                email: 'somsak@edl.com.la',
                phone: '02011111111',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ' },
                    division: { division_name: 'ພະແນກສັນຍາທົ່ວໄປ' },
                },
            });

            const result = await createUserUseCase.execute(
                { employeeCode: 'EDL-101', role: UserRole.MAIN_USER },
                divisionHeadUser,
            );

            expect(result.message).toContain('ສຳເລັດ');
            expect(mockUserRepo.createOrRestoreFromHrm).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeCode: 'EDL-101',
                    division: 'ພະແນກສັນຍາທົ່ວໄປ',
                    department: 'ຝ່າຍກົດໝາຍ',
                    role: UserRole.MAIN_USER,
                }),
                'div-head-uuid',
            );
        });

        it('should BLOCK DIVISION_HEAD from adding employee belonging to ANOTHER division', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-999',
                first_name_la: 'ທ້າວ',
                last_name_la: 'ໄຟຟ້າ',
                email: 'power@edl.com.la',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ' },
                    division: { division_name: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ' }, // DIFFERENT division!
                },
            });

            await expect(
                createUserUseCase.execute(
                    { employeeCode: 'EDL-999', role: UserRole.MAIN_USER },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(mockUserRepo.createOrRestoreFromHrm).not.toHaveBeenCalled();
        });

        it('should BLOCK DIVISION_HEAD from adding employee belonging to ANOTHER department', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-888',
                first_name_la: 'ທ້າວ',
                last_name_la: 'ການເງິນ',
                email: 'finance@edl.com.la',
                office: {
                    department: { department_name: 'ຝ່າຍການເງິນ' }, // DIFFERENT department!
                    division: { division_name: 'ພະແນກສັນຍາທົ່ວໄປ' },
                },
            });

            await expect(
                createUserUseCase.execute(
                    { employeeCode: 'EDL-888', role: UserRole.MAIN_USER },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(mockUserRepo.createOrRestoreFromHrm).not.toHaveBeenCalled();
        });

        it('should BLOCK DIVISION_HEAD from escalating privilege to ADMIN or DEPARTMENT_HEAD', async () => {
            await expect(
                createUserUseCase.execute(
                    { employeeCode: 'EDL-101', role: UserRole.ADMIN },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);

            await expect(
                createUserUseCase.execute(
                    { employeeCode: 'EDL-101', role: UserRole.DEPARTMENT_HEAD },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should BLOCK DIVISION_HEAD from assigning module permissions outside their division', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-101',
                first_name_la: 'ສົມສັກ',
                last_name_la: 'ສີສຸວັນ',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ' },
                    division: { division_name: 'ພະແນກສັນຍາທົ່ວໄປ' },
                },
            });

            await expect(
                createUserUseCase.execute(
                    {
                        employeeCode: 'EDL-101',
                        role: UserRole.MAIN_USER,
                        modulePermissions: [
                            { module: 'power-contracts' as any, canUpload: true }, // Not in General Contract!
                        ],
                    },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('ADMIN can create user in any division', async () => {
            const adminUser = { userId: 'admin-uuid', role: UserRole.ADMIN };

            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-777',
                first_name_la: 'ທຸກຄົນ',
                last_name_la: 'ທົ່ວໄປ',
                office: {
                    department: { department_name: 'ຝ່າຍໃດກໍໄດ້' },
                    division: { division_name: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ' },
                },
            });

            const result = await createUserUseCase.execute(
                { employeeCode: 'EDL-777', role: UserRole.ADMIN },
                adminUser,
            );

            expect(result.message).toContain('ສຳເລັດ');
            expect(mockUserRepo.createOrRestoreFromHrm).toHaveBeenCalled();
        });

        it('should pass email as null when HRM has empty email and no email provided in DTO', async () => {
            const adminUser = { userId: 'admin-uuid', role: UserRole.ADMIN };

            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: '43597',
                first_name_la: 'ບຸນທະວີ',
                last_name_la: 'ກຳມະວົງສາ',
                email: '',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ-ສັນຍາ' },
                    division: { division_name: 'ພະແนກສັນຍາທົ່ວໄປ (ຝກສ)' },
                },
            });

            await createUserUseCase.execute(
                { employeeCode: '43597', role: UserRole.VIEWER },
                adminUser,
            );

            expect(mockUserRepo.createOrRestoreFromHrm).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeCode: '43597',
                    email: null,
                }),
                'admin-uuid',
            );
        });
    });

    describe('GetHrmEmployeeUseCase for DIVISION_HEAD', () => {
        let getHrmEmployeeUseCase: GetHrmEmployeeUseCase;
        let mockHrmApi: any;
        let mockUserRepo: any;
        let mockConfigService: any;

        const divisionHeadUser = {
            userId: 'div-head-uuid',
            role: UserRole.DIVISION_HEAD,
            division: 'ພະແນກສັນຍາທົ່ວໄປ',
            department: 'ຝ່າຍກົດໝາຍ',
        };

        beforeEach(() => {
            mockHrmApi = {
                login: vi.fn().mockResolvedValue('fake-hrm-token'),
                getEmployeeByCode: vi.fn(),
            };
            mockUserRepo = {
                findByEmployeeCode: vi.fn().mockResolvedValue(null),
            };
            mockConfigService = {
                get: vi.fn((key: string) => (key === 'HRM_SYNC_USERNAME' ? 'Ton' : 'HRM1234')),
            };

            getHrmEmployeeUseCase = new GetHrmEmployeeUseCase(mockHrmApi, mockUserRepo, mockConfigService);
        });

        it('should return canAdd: true when employee is in the same division', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-101',
                first_name_la: 'ສົມສັກ',
                last_name_la: 'ສີສຸວັນ',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ' },
                    division: { division_name: 'ພະແນກສັນຍາທົ່ວໄປ' },
                },
            });

            const res = await getHrmEmployeeUseCase.execute('EDL-101', divisionHeadUser);
            expect(res.data.isSameDivision).toBe(true);
            expect(res.data.canAdd).toBe(true);
            expect(res.data.divisionMismatchWarning).toBeNull();
        });

        it('should return canAdd: false and warning when employee is in a different division', async () => {
            mockHrmApi.getEmployeeByCode.mockResolvedValue({
                emp_code: 'EDL-999',
                first_name_la: 'ທ້າວ',
                last_name_la: 'ໄຟຟ້າ',
                office: {
                    department: { department_name: 'ຝ່າຍກົດໝາຍ' },
                    division: { division_name: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ' },
                },
            });

            const res = await getHrmEmployeeUseCase.execute('EDL-999', divisionHeadUser);
            expect(res.data.isSameDivision).toBe(false);
            expect(res.data.canAdd).toBe(false);
            expect(res.data.divisionMismatchWarning).toContain('ບໍ່ແມ່ນພະແນກຂອງທ່ານ');
        });
    });

    describe('UserRepository.findAll & GetUsersUseCase Division Filtering', () => {
        it('should pass division filter to userRepository when caller is DIVISION_HEAD', async () => {
            const { GetUsersUseCase } = await import('../src/modules/users/application/use-cases/get-users.use-case.js');
            const mockUserRepo = {
                findAll: vi.fn().mockResolvedValue({ data: [], total: 0 }),
            };
            const getUsersUseCase = new GetUsersUseCase(mockUserRepo as any);

            const divisionHead = {
                userId: 'head-id',
                role: UserRole.DIVISION_HEAD,
                division: 'ພະແນກສັນຍາທົ່ວໄປ',
                department: 'ຝ່າຍກົດໝາຍ-ສັນຍາ',
            };

            await getUsersUseCase.execute({ page: 1, limit: 10 }, divisionHead);

            expect(mockUserRepo.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    division: 'ພະແນກສັນຍາທົ່ວໄປ',
                }),
            );
        });

        it('should generate valid Prisma where conditions without mode inside not', async () => {
            const { UserRepository } = await import('../src/modules/users/infrastructure/repositories/user.repository.js');
            let capturedWhere: any = null;
            const mockPrisma = {
                $transaction: vi.fn().mockImplementation(([findManyPromise, countPromise]) => {
                    return Promise.resolve([[], 0]);
                }),
                user: {
                    findMany: vi.fn().mockImplementation((args) => {
                        capturedWhere = args.where;
                        return Promise.resolve([]);
                    }),
                    count: vi.fn().mockResolvedValue(0),
                },
            };

            const userRepo = new UserRepository(mockPrisma as any, {} as any);

            // Test General Contracts division
            await userRepo.findAll({
                skip: 0,
                take: 10,
                division: 'ພະແນກສັນຍາທົ່ວໄປ',
            });

            expect(capturedWhere).toBeDefined();
            const stringified = JSON.stringify(capturedWhere);
            // Verify that `not` does NOT contain `mode`
            expect(stringified).not.toContain('{"contains":"ຊື້-ຂາຍໄຟ","mode"');
            expect(stringified).not.toContain('{"contains":"ຊື້ຂາຍໄຟ","mode"');
        });
    });

    describe('UpdateUserUseCase security checks for DIVISION_HEAD', () => {
        let updateUserUseCase: any;
        let mockUserRepo: any;

        const divisionHeadUser = {
            userId: 'div-head-uuid',
            role: UserRole.DIVISION_HEAD,
            division: 'ພະແນກສັນຍາທົ່ວໄປ',
            department: 'ຝ່າຍກົດໝາຍ',
        };

        const targetUserSameDiv = {
            id: 'target-user-1',
            fullName: 'ສົມສັກ ສີສຸວັນ',
            division: 'ພະແນກສັນຍາທົ່ວໄປ',
            department: 'ຝ່າຍກົດໝາຍ',
            role: UserRole.MAIN_USER,
        };

        const targetUserDiffDiv = {
            id: 'target-user-2',
            fullName: 'ທ້າວ ໄຟຟ້າ',
            division: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
            department: 'ຝ່າຍກົດໝາຍ',
            role: UserRole.MAIN_USER,
        };

        beforeEach(async () => {
            const { UpdateUserUseCase } = await import('../src/modules/users/application/use-cases/update-user.use-case.js');
            mockUserRepo = {
                findById: vi.fn().mockImplementation((id: string) => {
                    if (id === 'target-user-1') return Promise.resolve(targetUserSameDiv);
                    if (id === 'target-user-2') return Promise.resolve(targetUserDiffDiv);
                    return Promise.resolve(null);
                }),
                findRoleById: vi.fn().mockImplementation((roleId: string) => {
                    if (roleId === 'admin-role-id') return Promise.resolve({ id: 'admin-role-id', name: 'ADMIN' });
                    if (roleId === 'dept-role-id') return Promise.resolve({ id: 'dept-role-id', name: 'DEPARTMENT_HEAD' });
                    if (roleId === 'editor-role-id') return Promise.resolve({ id: 'editor-role-id', name: 'EDITOR' });
                    return Promise.resolve(null);
                }),
                updateWithAudit: vi.fn().mockImplementation((id, dto, oldUser, currentUserId) => Promise.resolve({ id, ...oldUser, ...dto })),
            };
            updateUserUseCase = new UpdateUserUseCase(mockUserRepo);
        });

        it('should BLOCK DIVISION_HEAD from updating user in ANOTHER division', async () => {
            await expect(
                updateUserUseCase.execute('target-user-2', { fullName: 'Updated' }, divisionHeadUser),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should BLOCK DIVISION_HEAD from setting role to ADMIN or DEPARTMENT_HEAD via role string', async () => {
            await expect(
                updateUserUseCase.execute('target-user-1', { role: UserRole.ADMIN }, divisionHeadUser),
            ).rejects.toThrow(ForbiddenException);

            await expect(
                updateUserUseCase.execute('target-user-1', { role: UserRole.DEPARTMENT_HEAD }, divisionHeadUser),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should BLOCK DIVISION_HEAD from setting role to ADMIN or DEPARTMENT_HEAD via roleId', async () => {
            await expect(
                updateUserUseCase.execute('target-user-1', { roleId: 'admin-role-id' }, divisionHeadUser),
            ).rejects.toThrow(ForbiddenException);

            await expect(
                updateUserUseCase.execute('target-user-1', { roleId: 'dept-role-id' }, divisionHeadUser),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should BLOCK DIVISION_HEAD from assigning cross-division module permissions', async () => {
            await expect(
                updateUserUseCase.execute(
                    'target-user-1',
                    {
                        modulePermissions: [
                            { module: 'POWER_CONTRACTS' as any, canView: true, canUpload: true },
                        ],
                    },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should BLOCK DIVISION_HEAD from moving user to another division', async () => {
            await expect(
                updateUserUseCase.execute(
                    'target-user-1',
                    { division: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ' },
                    divisionHeadUser,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should ALLOW DIVISION_HEAD to update user within their own division and allowed modules', async () => {
            const res = await updateUserUseCase.execute(
                'target-user-1',
                {
                    fullName: 'ສົມສັກ ອັບເດດ',
                    role: UserRole.EDITOR,
                    modulePermissions: [
                        { module: 'CONTRACTS' as any, canView: true, canEdit: true },
                    ],
                },
                divisionHeadUser,
            );

            expect(res.message).toContain('ສຳເລັດ');
            expect(mockUserRepo.updateWithAudit).toHaveBeenCalled();
        });
    });

    describe('DIVISION_HEAD cross-division CRUD isolation in canAccessModule', () => {
        // Simulates DB role where DIVISION_HEAD has all 4 modules set to true in roleRef.permissions
        const divHeadGeneralContract = {
            role: UserRole.DIVISION_HEAD,
            division: 'ພະແນກສັນຍາທົ່ວໄປ',
            roleRef: {
                name: 'DIVISION_HEAD',
                permissions: [
                    { module: 'CONTRACTS', canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
                    { module: 'POWER_CONTRACTS', canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
                    { module: 'LEGAL_DOCUMENTS', canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
                    { module: 'LEGAL_CASES', canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
                ],
            },
        };

        it('should ALLOW DIVISION_HEAD to CRUD within their home division (CONTRACTS)', () => {
            expect(canAccessModule(divHeadGeneralContract, SystemModule.CONTRACTS, 'canView')).toBe(true);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.CONTRACTS, 'canUpload')).toBe(true);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.CONTRACTS, 'canEdit')).toBe(true);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.CONTRACTS, 'canDelete')).toBe(true);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.CONTRACTS, 'canDownload')).toBe(true);
        });

        it('should STRICTLY BLOCK DIVISION_HEAD from CRUD on POWER_CONTRACTS even if roleRef has permissions', () => {
            expect(canAccessModule(divHeadGeneralContract, SystemModule.POWER_CONTRACTS, 'canView')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.POWER_CONTRACTS, 'canUpload')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.POWER_CONTRACTS, 'canEdit')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.POWER_CONTRACTS, 'canDelete')).toBe(false);
        });

        it('should STRICTLY BLOCK DIVISION_HEAD from CRUD on LEGAL_DOCUMENTS & LEGAL_CASES even if roleRef has permissions', () => {
            expect(canAccessModule(divHeadGeneralContract, SystemModule.LEGAL_DOCUMENTS, 'canView')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.LEGAL_DOCUMENTS, 'canUpload')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.LEGAL_CASES, 'canView')).toBe(false);
            expect(canAccessModule(divHeadGeneralContract, SystemModule.LEGAL_CASES, 'canUpload')).toBe(false);
        });
    });
});
