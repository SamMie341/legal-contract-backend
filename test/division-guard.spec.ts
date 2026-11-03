import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditAction, UserRole } from '@prisma/client';
import { Division, SystemModule } from '../src/core/constants/division.constant.js';
import {
    isGeneralContractDivision,
    isLegalAndDisputeDivision,
    isPowerContractDivision,
    canAccessModule,
    getAccessibleModules,
    getPermissionsByModule,
    buildDefaultPermissionsForRole,
    resolveToPrismaModules,
    assertCanAccessModule,
    normalizeLaoText,
    resolveModuleFromPath,
    getRequiredDivisionForModule,
} from '../src/core/utils/division-helper.util.js';
import { REQUIRE_ACCESS_KEY } from '../src/core/decorators/require-access.decorator.js';
import { DivisionGuard } from '../src/core/guards/division.guard.js';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('DivisionHelper (ການແຍກສິດ ແລະ ໂມດູນຕາມ Division)', () => {
    describe('Text Normalization & Matchers', () => {
        it('should correctly normalize Lao text with mixed vowels and spacing', () => {
            expect(normalizeLaoText(' ພະແນກນິຕິກໍາ  ແລະ  ແກ້ໄຂ ')).toBe('ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂ');
        });

        it('should correctly match General Contract Division with various text inputs', () => {
            expect(isGeneralContractDivision('ພະແນກສັນຍາທົ່ວໄປ')).toBe(true);
            expect(isGeneralContractDivision(' ພະແນກສັນຍາ ')).toBe(true);
            expect(isGeneralContractDivision('ພະແນກສັນຍາທົ່ວໄປ ຟຟລ')).toBe(true);

            expect(isGeneralContractDivision('ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ')).toBe(false);
            expect(isGeneralContractDivision('ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ')).toBe(false);
            expect(isGeneralContractDivision('')).toBe(false);
            expect(isGeneralContractDivision(null)).toBe(false);
        });

        it('should correctly match Power Purchase & Sale Contract Division', () => {
            expect(isPowerContractDivision('ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ')).toBe(true);
            expect(isPowerContractDivision('ພະແນກສັນຍາຊື້ຂາຍໄຟ')).toBe(true);
            expect(isPowerContractDivision('ພະແນກສັນຍາຊື້-ຂາຍໄຟ')).toBe(true);

            expect(isPowerContractDivision('ພະແນກສັນຍາທົ່ວໄປ')).toBe(false);
            expect(isPowerContractDivision('ພະແນກນິຕິກຳ')).toBe(false);
            expect(isPowerContractDivision(null)).toBe(false);
        });

        it('should correctly match Legal and Dispute Division (ຂໍ້ 2 ແລະ 3 ຄືອັນດຽວກັນ)', () => {
            expect(isLegalAndDisputeDivision('ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ')).toBe(true);
            expect(isLegalAndDisputeDivision('ພະແນກນິຕິກຳ')).toBe(true);
            expect(isLegalAndDisputeDivision('ພະແນກນິຕິກໍາ')).toBe(true);
            expect(isLegalAndDisputeDivision('ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ')).toBe(true);

            expect(isLegalAndDisputeDivision('ພະແນກສັນຍາທົ່ວໄປ')).toBe(false);
            expect(isLegalAndDisputeDivision('IT Department')).toBe(false);
            expect(isLegalAndDisputeDivision('')).toBe(false);
            expect(isLegalAndDisputeDivision(null)).toBe(false);
        });
    });

    describe('canAccessModule', () => {
        const adminUser = { role: UserRole.ADMIN, division: 'IT' };
        const contractMainUser = { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT };
        const powerMainUser = { role: UserRole.MAIN_USER, division: Division.POWER_CONTRACTS };
        const legalAndDisputeUser = { role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE };
        const otherUser = { role: UserRole.VIEWER, division: 'ພະແນກການເງິນ' };

        it('Admin should be able to access ALL modules', () => {
            expect(canAccessModule(adminUser, SystemModule.CONTRACTS)).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.POWER_CONTRACTS)).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.LEGAL_DOCUMENTS)).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.LEGAL_CASES)).toBe(true);
            expect(canAccessModule(adminUser, SystemModule.USERS)).toBe(true);
        });

        it('Power Contract User should ONLY access Power Contracts and common modules', () => {
            expect(canAccessModule(powerMainUser, SystemModule.POWER_CONTRACTS)).toBe(true);
            expect(canAccessModule(powerMainUser, SystemModule.DEPARTMENTS)).toBe(true);
            expect(canAccessModule(powerMainUser, SystemModule.SUPPORT)).toBe(true);

            expect(canAccessModule(powerMainUser, SystemModule.CONTRACTS)).toBe(false);
            expect(canAccessModule(powerMainUser, SystemModule.LEGAL_DOCUMENTS)).toBe(false);
            expect(canAccessModule(powerMainUser, SystemModule.LEGAL_CASES)).toBe(false);
        });

        it('Contract Main User should ONLY access Contract modules and common modules', () => {
            expect(canAccessModule(contractMainUser, SystemModule.CONTRACTS)).toBe(true);
            expect(canAccessModule(contractMainUser, SystemModule.CONTRACT_TYPES)).toBe(true);
            expect(canAccessModule(contractMainUser, SystemModule.DEPARTMENTS)).toBe(true);
            expect(canAccessModule(contractMainUser, SystemModule.SUPPORT)).toBe(true);

            // Cannot access Legal Documents or Legal Cases
            expect(canAccessModule(contractMainUser, SystemModule.LEGAL_DOCUMENTS)).toBe(false);
            expect(canAccessModule(contractMainUser, SystemModule.LEGAL_CASES)).toBe(false);
        });

        it('Legal & Dispute User can access BOTH Documents and Cases, but NOT Contracts', () => {
            expect(canAccessModule(legalAndDisputeUser, SystemModule.LEGAL_DOCUMENTS)).toBe(true);
            expect(canAccessModule(legalAndDisputeUser, SystemModule.LEGAL_CASES)).toBe(true);
            expect(canAccessModule(legalAndDisputeUser, SystemModule.DEPARTMENTS)).toBe(true);
            expect(canAccessModule(legalAndDisputeUser, SystemModule.SUPPORT)).toBe(true);

            expect(canAccessModule(legalAndDisputeUser, SystemModule.CONTRACTS)).toBe(false);
            expect(canAccessModule(legalAndDisputeUser, SystemModule.CONTRACT_TYPES)).toBe(false);
        });

        it('User from other division should not access specific modules', () => {
            expect(canAccessModule(otherUser, SystemModule.CONTRACTS)).toBe(false);
            expect(canAccessModule(otherUser, SystemModule.LEGAL_DOCUMENTS)).toBe(false);
            expect(canAccessModule(otherUser, SystemModule.LEGAL_CASES)).toBe(false);
            expect(canAccessModule(otherUser, SystemModule.DEPARTMENTS)).toBe(true);
        });
    });

    describe('getAccessibleModules', () => {
        it('should return all modules for Admin', () => {
            const modules = getAccessibleModules({ role: UserRole.ADMIN, division: 'IT' });
            expect(modules).toContain(SystemModule.CONTRACTS);
            expect(modules).toContain(SystemModule.POWER_CONTRACTS);
            expect(modules).toContain(SystemModule.LEGAL_DOCUMENTS);
            expect(modules).toContain(SystemModule.LEGAL_CASES);
            expect(modules).toContain(SystemModule.USERS);
        });

        it('should return only power contracts and common modules for Power Contracts division', () => {
            const modules = getAccessibleModules({ role: UserRole.MAIN_USER, division: Division.POWER_CONTRACTS });
            expect(modules).toContain(SystemModule.POWER_CONTRACTS);
            expect(modules).toContain(SystemModule.DEPARTMENTS);
            expect(modules).toContain(SystemModule.SUPPORT);
            expect(modules).not.toContain(SystemModule.CONTRACTS);
            expect(modules).not.toContain(SystemModule.LEGAL_DOCUMENTS);
            expect(modules).not.toContain(SystemModule.LEGAL_CASES);
        });

        it('should return only contracts and common modules for General Contracts division', () => {
            const modules = getAccessibleModules({ role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT });
            expect(modules).toContain(SystemModule.CONTRACTS);
            expect(modules).toContain(SystemModule.CONTRACT_TYPES);
            expect(modules).toContain(SystemModule.DEPARTMENTS);
            expect(modules).not.toContain(SystemModule.LEGAL_DOCUMENTS);
            expect(modules).not.toContain(SystemModule.LEGAL_CASES);
        });

        it('should return both legal documents and legal cases for Legal & Dispute division', () => {
            const modules = getAccessibleModules({ role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE });
            expect(modules).toContain(SystemModule.LEGAL_DOCUMENTS);
            expect(modules).toContain(SystemModule.LEGAL_CASES);
            expect(modules).not.toContain(SystemModule.CONTRACTS);
            expect(modules).not.toContain(SystemModule.CONTRACT_TYPES);
        });

        it('DEPARTMENT_HEAD should have view and download access to all 4 core modules, but NOT write actions', () => {
            const deptHead = { role: UserRole.DEPARTMENT_HEAD, division: 'ຫ້ອງການກວດກາ' };
            const modules = [
                SystemModule.CONTRACTS,
                SystemModule.POWER_CONTRACTS,
                SystemModule.LEGAL_DOCUMENTS,
                SystemModule.LEGAL_CASES,
            ];
            for (const mod of modules) {
                expect(canAccessModule(deptHead, mod, 'canView')).toBe(true);
                expect(canAccessModule(deptHead, mod, 'canDownload')).toBe(true);
                expect(canAccessModule(deptHead, mod, 'canUpload')).toBe(false);
                expect(canAccessModule(deptHead, mod, 'canEdit')).toBe(false);
                expect(canAccessModule(deptHead, mod, 'canDelete')).toBe(false);
            }
        });

        it('should grant cross-module access when modulePermissions are configured', () => {
            const user = {
                role: UserRole.EDITOR,
                division: Division.GENERAL_CONTRACT,
                modulePermissions: [
                    {
                        module: SystemModule.CONTRACTS,
                        canView: true,
                        canUpload: true,
                        canEdit: true,
                        canDelete: false,
                        canDownload: true,
                    },
                    {
                        module: SystemModule.LEGAL_DOCUMENTS,
                        canView: true,
                        canUpload: true,
                        canEdit: false,
                        canDelete: false,
                        canDownload: false,
                    },
                ],
            };

            // Home division module
            expect(canAccessModule(user, SystemModule.CONTRACTS, 'canView')).toBe(true);
            expect(canAccessModule(user, SystemModule.CONTRACTS, 'canUpload')).toBe(true);
            expect(canAccessModule(user, SystemModule.CONTRACTS, 'canDelete')).toBe(false);

            // Cross-module granted via matrix
            expect(canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canView')).toBe(true);
            expect(canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canUpload')).toBe(true);
            expect(canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canEdit')).toBe(false);

            // Cross-module NOT in matrix and not in home division
            expect(canAccessModule(user, SystemModule.LEGAL_CASES, 'canView')).toBe(false);
            expect(canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')).toBe(false);
        });

        it('should correctly build default permissions for various roles', () => {
            const adminPerms = buildDefaultPermissionsForRole(UserRole.ADMIN);
            expect(adminPerms).toHaveLength(4);
            expect(adminPerms.every((p) => p.canView && p.canUpload && p.canEdit && p.canDelete && p.canDownload)).toBe(true);

            const deptHeadPerms = buildDefaultPermissionsForRole(UserRole.DEPARTMENT_HEAD);
            expect(deptHeadPerms).toHaveLength(4);
            expect(deptHeadPerms.every((p) => p.canView && p.canDownload && !p.canUpload && !p.canEdit && !p.canDelete)).toBe(true);

            const divHeadPerms = buildDefaultPermissionsForRole(UserRole.DIVISION_HEAD, Division.GENERAL_CONTRACT);
            expect(divHeadPerms).toHaveLength(1);
            expect(divHeadPerms[0].module).toBe('CONTRACTS');
            expect(divHeadPerms[0].canDelete).toBe(true);

            const editorPerms = buildDefaultPermissionsForRole(UserRole.EDITOR, Division.POWER_CONTRACTS);
            expect(editorPerms).toHaveLength(1);
            expect(editorPerms[0].module).toBe('POWER_CONTRACTS');
            expect(editorPerms[0].canEdit).toBe(true);
            expect(editorPerms[0].canDelete).toBe(false);
        });

        it('should correctly calculate getPermissionsByModule', () => {
            const user = {
                role: UserRole.DEPARTMENT_HEAD,
                division: null,
            };
            const map = getPermissionsByModule(user);
            expect(map[SystemModule.CONTRACTS].canView).toBe(true);
            expect(map[SystemModule.CONTRACTS].canDownload).toBe(true);
            expect(map[SystemModule.CONTRACTS].canUpload).toBe(false);
            expect(map[SystemModule.POWER_CONTRACTS].canView).toBe(true);
            expect(map[SystemModule.LEGAL_DOCUMENTS].canView).toBe(true);
            expect(map[SystemModule.LEGAL_CASES].canView).toBe(true);
        });
    });

    describe('resolveModuleFromPath (ດັກຈັບການປ່ຽนແປງ URL Path)', () => {
        it('should resolve power contracts module from path with or without api prefix', () => {
            expect(resolveModuleFromPath('/power-contracts')).toBe(SystemModule.POWER_CONTRACTS);
            expect(resolveModuleFromPath('/api/power-contracts/dashboard')).toBe(SystemModule.POWER_CONTRACTS);
            expect(resolveModuleFromPath('/api/v1/power-contracts/123/edit')).toBe(SystemModule.POWER_CONTRACTS);
            expect(resolveModuleFromPath('/power-notifications')).toBe(SystemModule.POWER_CONTRACTS);
            expect(resolveModuleFromPath('/power-attachments/upload')).toBe(SystemModule.POWER_CONTRACTS);
        });

        it('should resolve general contracts and contract types', () => {
            expect(resolveModuleFromPath('/contracts')).toBe(SystemModule.CONTRACTS);
            expect(resolveModuleFromPath('/api/contracts?page=1&limit=10')).toBe(SystemModule.CONTRACTS);
            expect(resolveModuleFromPath('/notifications')).toBe(SystemModule.CONTRACTS);
            expect(resolveModuleFromPath('/attachments/download/abc')).toBe(SystemModule.CONTRACTS);
            expect(resolveModuleFromPath('/contract-types')).toBe(SystemModule.CONTRACT_TYPES);
            expect(resolveModuleFromPath('/api/contract-types/1')).toBe(SystemModule.CONTRACT_TYPES);
        });

        it('should resolve legal documents and legal cases', () => {
            expect(resolveModuleFromPath('/legal-documents')).toBe(SystemModule.LEGAL_DOCUMENTS);
            expect(resolveModuleFromPath('/api/legal-documents/123')).toBe(SystemModule.LEGAL_DOCUMENTS);
            expect(resolveModuleFromPath('/document-attachments/preview')).toBe(SystemModule.LEGAL_DOCUMENTS);
            expect(resolveModuleFromPath('/legal-cases')).toBe(SystemModule.LEGAL_CASES);
            expect(resolveModuleFromPath('/case-attachments/download')).toBe(SystemModule.LEGAL_CASES);
        });

        it('should resolve admin and shared modules', () => {
            expect(resolveModuleFromPath('/users')).toBe(SystemModule.USERS);
            expect(resolveModuleFromPath('/audit-logs')).toBe(SystemModule.AUDIT_LOGS);
            expect(resolveModuleFromPath('/departments')).toBe(SystemModule.DEPARTMENTS);
            expect(resolveModuleFromPath('/support')).toBe(SystemModule.SUPPORT);
        });

        it('should return null for non-module paths, auth, or invalid paths', () => {
            expect(resolveModuleFromPath('/auth/login')).toBeNull();
            expect(resolveModuleFromPath('/auth/me')).toBeNull();
            expect(resolveModuleFromPath('/api/v1/auth/login')).toBeNull();
            expect(resolveModuleFromPath('')).toBeNull();
            expect(resolveModuleFromPath(null)).toBeNull();
            expect(resolveModuleFromPath(undefined)).toBeNull();
            expect(resolveModuleFromPath('/random-unknown-path')).toBeNull();
        });
    });

    describe('getRequiredDivisionForModule', () => {
        it('should return correct required division for each module', () => {
            expect(getRequiredDivisionForModule(SystemModule.CONTRACTS)).toBe(Division.GENERAL_CONTRACT);
            expect(getRequiredDivisionForModule(SystemModule.CONTRACT_TYPES)).toBe(Division.GENERAL_CONTRACT);
            expect(getRequiredDivisionForModule(SystemModule.POWER_CONTRACTS)).toBe(Division.POWER_CONTRACTS);
            expect(getRequiredDivisionForModule(SystemModule.LEGAL_DOCUMENTS)).toBe(Division.LEGAL_AND_DISPUTE);
            expect(getRequiredDivisionForModule(SystemModule.LEGAL_CASES)).toBe(Division.LEGAL_AND_DISPUTE);
            expect(getRequiredDivisionForModule(SystemModule.USERS)).toContain('Admin');
            expect(getRequiredDivisionForModule(SystemModule.DEPARTMENTS)).toContain('All');
        });
    });

    describe('assertCanAccessModule', () => {
        it('should throw ForbiddenException with PATH_DIVISION_MISMATCH when accessing prohibited module', () => {
            const contractUser = { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT };
            try {
                assertCanAccessModule(contractUser, SystemModule.LEGAL_DOCUMENTS, '/api/legal-documents');
                expect.unreachable('Should have thrown ForbiddenException');
            } catch (err: any) {
                expect(err).toBeInstanceOf(ForbiddenException);
                const response = err.getResponse();
                expect(response.code).toBe('PATH_DIVISION_MISMATCH');
                expect(response.details.attemptedPath).toBe('/api/legal-documents');
                expect(response.details.userDivision).toBe(Division.GENERAL_CONTRACT);
                expect(response.details.requiredDivision).toBe(Division.LEGAL_AND_DISPUTE);
            }
        });

        it('should not throw when accessing authorized module', () => {
            const contractUser = { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT };
            expect(() => assertCanAccessModule(contractUser, SystemModule.CONTRACTS)).not.toThrow();

            const legalUser = { role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE };
            expect(() => assertCanAccessModule(legalUser, SystemModule.LEGAL_DOCUMENTS)).not.toThrow();
            expect(() => assertCanAccessModule(legalUser, SystemModule.LEGAL_CASES)).not.toThrow();
        });
    });
});

describe('DivisionGuard (ກວດສອບສິດ ແລະ ດັກຈັບການປ່ຽນ Path ເພື່ອເຂົ້າເຖິງຂ້າມພະແນກ)', () => {
    let reflector: Reflector;
    let guard: DivisionGuard;
    let mockPrisma: any;

    const createMockContext = (
        user: any,
        options?: { url?: string; method?: string; ip?: string },
    ): ExecutionContext => {
        return {
            getHandler: vi.fn(),
            getClass: vi.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    originalUrl: options?.url || '',
                    method: options?.method || 'GET',
                    ip: options?.ip || '127.0.0.1',
                }),
            }),
        } as unknown as ExecutionContext;
    };

    beforeEach(() => {
        reflector = new Reflector();
        mockPrisma = {
            auditLog: {
                create: vi.fn().mockResolvedValue({ id: 'mock-audit-id' }),
            },
        };
        guard = new DivisionGuard(reflector, mockPrisma);
    });

    it('should allow access if no @RequiredModule and path is not module-specific', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        const context = createMockContext({ role: UserRole.MAIN_USER });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow Admin to access any required module and path', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.CONTRACTS);
        const context = createMockContext(
            { id: 'admin-uuid', role: UserRole.ADMIN, division: 'IT' },
            { url: '/api/contracts' },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should block Main User from Legal & Dispute division attempting to access Contracts and log security audit', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.CONTRACTS);
        const context = createMockContext(
            {
                id: 'user-legal-uuid',
                userId: 'user-legal-uuid',
                username: 'somchai_legal',
                role: UserRole.MAIN_USER,
                division: Division.LEGAL_AND_DISPUTE,
            },
            { url: '/contracts/123/edit', method: 'PATCH', ip: '192.168.1.100' },
        );

        try {
            guard.canActivate(context);
            expect.unreachable('Should have thrown ForbiddenException');
        } catch (err: any) {
            expect(err).toBeInstanceOf(ForbiddenException);
            const response = err.getResponse();
            expect(response.code).toBe('PATH_DIVISION_MISMATCH');
            expect(response.details.attemptedPath).toBe('/contracts/123/edit');
            expect(response.details.userDivision).toBe(Division.LEGAL_AND_DISPUTE);
            expect(response.details.requiredDivision).toBe(Division.GENERAL_CONTRACT);

            // Audit log write should be invoked
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: 'user-legal-uuid',
                        action: AuditAction.USER_PERMISSION_CHANGE,
                        newValues: expect.objectContaining({
                            alertType: 'PATH_TAMPERING_DETECTED',
                            attemptedPath: '/contracts/123/edit',
                            httpMethod: 'PATCH',
                            requiredDivision: Division.GENERAL_CONTRACT,
                            targetModule: SystemModule.CONTRACTS,
                        }),
                    }),
                }),
            );
        }
    });

    it('should detect path tampering when user changes URL path even WITHOUT @RequiredModule metadata', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        // User belongs to General Contracts, but manually requested /api/legal-cases
        const context = createMockContext(
            {
                id: 'user-contracts-uuid',
                userId: 'user-contracts-uuid',
                username: 'kham_contracts',
                role: UserRole.MAIN_USER,
                division: Division.GENERAL_CONTRACT,
            },
            { url: '/api/legal-cases?status=ACTIVE', method: 'GET', ip: '10.0.0.5' },
        );

        try {
            guard.canActivate(context);
            expect.unreachable('Should have thrown ForbiddenException');
        } catch (err: any) {
            expect(err).toBeInstanceOf(ForbiddenException);
            const response = err.getResponse();
            expect(response.code).toBe('PATH_DIVISION_MISMATCH');
            expect(response.details.attemptedPath).toBe('/api/legal-cases?status=ACTIVE');
            expect(response.details.targetModule).toBe(SystemModule.LEGAL_CASES);
            expect(response.details.requiredDivision).toBe(Division.LEGAL_AND_DISPUTE);

            // Verify audit log
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: 'user-contracts-uuid',
                        action: AuditAction.USER_PERMISSION_CHANGE,
                        newValues: expect.objectContaining({
                            alertType: 'PATH_TAMPERING_DETECTED',
                            attemptedPath: '/api/legal-cases?status=ACTIVE',
                            targetModule: SystemModule.LEGAL_CASES,
                        }),
                    }),
                }),
            );
        }
    });

    it('should allow Legal & Dispute user to access Legal Documents and Legal Cases', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.LEGAL_DOCUMENTS);
        const context = createMockContext(
            { role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE },
            { url: '/legal-documents' },
        );
        expect(guard.canActivate(context)).toBe(true);

        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.LEGAL_CASES);
        const contextCases = createMockContext(
            { role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE },
            { url: '/legal-cases' },
        );
        expect(guard.canActivate(contextCases)).toBe(true);
    });

    it('should allow all divisions to access common modules (departments, support)', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.DEPARTMENTS);
        const contextDep = createMockContext(
            { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT },
            { url: '/departments/dropdown' },
        );
        expect(guard.canActivate(contextDep)).toBe(true);

        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.SUPPORT);
        const contextSup = createMockContext(
            { role: UserRole.MAIN_USER, division: Division.POWER_CONTRACTS },
            { url: '/support/tickets' },
        );
        expect(guard.canActivate(contextSup)).toBe(true);
    });

    it('should allow DEPARTMENT_HEAD to access GET endpoints across all 4 modules', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === REQUIRE_ACCESS_KEY) return undefined;
            return SystemModule.POWER_CONTRACTS;
        });

        const context = createMockContext(
            { role: UserRole.DEPARTMENT_HEAD, division: 'ຫ້ອງການກວດກາ' },
            { url: '/power-contracts/dashboard', method: 'GET' },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should block DEPARTMENT_HEAD from write operations (POST, PATCH, DELETE)', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === REQUIRE_ACCESS_KEY) return undefined;
            return SystemModule.CONTRACTS;
        });

        const context = createMockContext(
            { role: UserRole.DEPARTMENT_HEAD, division: 'ຫ້ອງການກວດກາ' },
            { url: '/contracts', method: 'POST' },
        );
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should respect @RequireAccess metadata for granular permission checks', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === REQUIRE_ACCESS_KEY) {
                return { module: SystemModule.CONTRACTS, action: 'canDownload' };
            }
            return SystemModule.CONTRACTS;
        });

        const allowedContext = createMockContext(
            {
                role: UserRole.VIEWER,
                division: Division.GENERAL_CONTRACT,
                canDownload: true,
                canView: true,
            },
            { url: '/contracts/attachments/download/1', method: 'GET' },
        );
        expect(guard.canActivate(allowedContext)).toBe(true);

        const deniedContext = createMockContext(
            {
                role: UserRole.VIEWER,
                division: Division.GENERAL_CONTRACT,
                canDownload: false,
                canView: true,
            },
            { url: '/contracts/attachments/download/1', method: 'GET' },
        );
        expect(() => guard.canActivate(deniedContext)).toThrow(ForbiddenException);
    });

    it('should allow cross-module access when user has custom modulePermissions', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
            if (key === REQUIRE_ACCESS_KEY) return undefined;
            return SystemModule.LEGAL_DOCUMENTS;
        });

        const context = createMockContext(
            {
                role: UserRole.EDITOR,
                division: Division.GENERAL_CONTRACT, // Home is contracts!
                modulePermissions: [
                    {
                        module: SystemModule.LEGAL_DOCUMENTS,
                        canView: true,
                        canUpload: true,
                        canEdit: true,
                        canDelete: false,
                        canDownload: true,
                    },
                ],
            },
            { url: '/legal-documents', method: 'POST' },
        );
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should support 3rd Pillar combined key LEGAL_AND_DISPUTE in permissionsByModule and access checks', () => {
        const user = {
            role: UserRole.MAIN_USER,
            division: Division.LEGAL_AND_DISPUTE,
        };

        const perms = getPermissionsByModule(user as any);
        expect(perms['LEGAL_AND_DISPUTE']).toBeDefined();
        expect(perms['LEGAL_AND_DISPUTE'].canView).toBe(true);
        expect(perms['LEGAL_AND_DISPUTE'].canUpload).toBe(true);
        expect(perms['CONTRACTS'].canView).toBe(false);

        // Access checks with LEGAL_AND_DISPUTE as target module
        expect(canAccessModule(user as any, 'LEGAL_AND_DISPUTE' as any, 'canView')).toBe(true);
        expect(canAccessModule(user as any, 'LEGAL_AND_DISPUTE' as any, 'canUpload')).toBe(true);
    });

    it('should correctly resolve various module inputs to valid Prisma SystemModule enum values', () => {
        expect(resolveToPrismaModules('contracts')).toEqual(['CONTRACTS']);
        expect(resolveToPrismaModules('CONTRACTS')).toEqual(['CONTRACTS']);
        expect(resolveToPrismaModules('contract-types')).toEqual(['CONTRACTS']);
        expect(resolveToPrismaModules('power-contracts')).toEqual(['POWER_CONTRACTS']);
        expect(resolveToPrismaModules('legal-documents')).toEqual(['LEGAL_DOCUMENTS']);
        expect(resolveToPrismaModules('legal-cases')).toEqual(['LEGAL_CASES']);
        expect(resolveToPrismaModules('LEGAL_AND_DISPUTE')).toEqual(['LEGAL_DOCUMENTS', 'LEGAL_CASES']);
        expect(resolveToPrismaModules('unknown_module')).toEqual([]);
        expect(resolveToPrismaModules(null)).toEqual([]);
    });
});
