import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import { Division, SystemModule } from '../src/core/constants/division.constant.js';
import {
    isGeneralContractDivision,
    isLegalDocumentDivision,
    isDisputeResolutionDivision,
    isLegalAndDisputeDivision,
    isPowerContractDivision,
    canAccessModule,
    getAccessibleModules,
    assertCanAccessModule,
    normalizeLaoText,
} from '../src/core/utils/division-helper.util.js';
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
    });

    describe('assertCanAccessModule', () => {
        it('should throw ForbiddenException when accessing prohibited module', () => {
            const contractUser = { role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT };
            expect(() => assertCanAccessModule(contractUser, SystemModule.LEGAL_DOCUMENTS)).toThrow(ForbiddenException);
            expect(() => assertCanAccessModule(contractUser, SystemModule.LEGAL_CASES)).toThrow(ForbiddenException);

            const legalUser = { role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE };
            expect(() => assertCanAccessModule(legalUser, SystemModule.CONTRACTS)).toThrow(ForbiddenException);
            expect(() => assertCanAccessModule(legalUser, SystemModule.CONTRACT_TYPES)).toThrow(ForbiddenException);
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

describe('DivisionGuard', () => {
    let reflector: Reflector;
    let guard: DivisionGuard;

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
        guard = new DivisionGuard(reflector);
    });

    it('should allow access if no @RequiredModule is set', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        const context = createMockContext({ role: UserRole.MAIN_USER });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow Admin to access any required module', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.CONTRACTS);
        const context = createMockContext({ role: UserRole.ADMIN, division: 'IT' });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should block Main User from Legal & Dispute division attempting to access Contracts', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.CONTRACTS);
        const context = createMockContext({ role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE });
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow Legal & Dispute user to access Legal Documents and Legal Cases', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.LEGAL_DOCUMENTS);
        const context = createMockContext({ role: UserRole.MAIN_USER, division: Division.LEGAL_AND_DISPUTE });
        expect(guard.canActivate(context)).toBe(true);

        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.LEGAL_CASES);
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should block Contracts user from accessing Legal Cases', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(SystemModule.LEGAL_CASES);
        const context = createMockContext({ role: UserRole.MAIN_USER, division: Division.GENERAL_CONTRACT });
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
});
