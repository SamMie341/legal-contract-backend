import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Division, SystemModule } from '../constants/division.constant.js';

/**
 * ປັບຮູບແບບຂໍ້ຄວາມພາສາລາວ (Normalization) ໃຫ້ເປັນມາດຕະຖານດຽວກັນ
 * ເຊັ່ນ: ແປງສະຫຼະອຳ (ໍາ -> ຳ), ຕັດຊ່ອງຫວ່າງເກີນ
 */
export function normalizeLaoText(text?: string | null): string {
    if (!text) return '';
    return text
        .normalize('NFC')
        .replace(/[\u0eb2][\u0ecd]|[\u0ecd][\u0eb2]/g, '\u0eb3') // Normalize Lao am vowel
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * ກວດສອບວ່າເປັນພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Purchase & Sale Contracts Division) ຫຼືບໍ່
 */
export function isPowerContractDivision(division?: string | null): boolean {
    if (!division) return false;
    const normalized = normalizeLaoText(division);
    return (
        normalized.includes('ຊື້-ຂາຍໄຟ') ||
        normalized.includes('ຊື້ຂາຍໄຟ') ||
        (normalized.includes('ສັນຍາ') && (normalized.includes('ໄຟ') || normalized.includes('ໄຟຟ້າ')))
    );
}

/**
 * ກວດສອບວ່າເປັນພະແນກສັນຍາທົ່ວໄປ (General Contracts Division) ຫຼືບໍ່
 */
export function isGeneralContractDivision(division?: string | null): boolean {
    if (!division) return false;
    if (isPowerContractDivision(division)) return false;
    const normalized = normalizeLaoText(division);
    return normalized.includes('ສັນຍາ') || normalized.includes('ທົ່ວໄປ');
}

/**
 * ກວດສອບວ່າເປັນພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Dispute Resolution Division) ຫຼືບໍ່
 * ໝາຍເຫດ: ຂໍ້ 2 (ນິຕິກຳ) ແລະ ຂໍ້ 3 (ແກ້ໄຂຂໍ້ຂັດແຍ່ງ/ຄະດີ) ແມ່ນສັງກັດພະແນກດຽວກັນ
 */
export function isLegalAndDisputeDivision(division?: string | null): boolean {
    if (!division) return false;
    const normalized = normalizeLaoText(division);
    return (
        normalized.includes('ນິຕິກຳ') ||
        normalized.includes('ນິຕິກໍາ') ||
        normalized.includes('ຂັດແຍ່ງ') ||
        normalized.includes('ຄະດີ')
    );
}

// ເປັນພະແນກດຽວກັນ (Alias ເພື່ອ backward-compatibility)
export const isLegalDocumentDivision = isLegalAndDisputeDivision;
export const isDisputeResolutionDivision = isLegalAndDisputeDivision;

/**
 * ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມ Division ແລະ Role ຂອງ User
 */
export function canAccessModule(
    user: { role?: UserRole; division?: string | null } | null | undefined,
    module: SystemModule,
): boolean {
    if (!user) return false;

    // 1. Admin ສາມາດເຂົ້າເຖິງໄດ້ທຸກໂມດູນ
    if (user.role === UserRole.ADMIN) {
        return true;
    }

    // 2. ໂມດູນກາງທີ່ທຸກພະແນກໃຊ້ຮ່ວມກັນໄດ້ (Master Data / Dropdown / Support)
    if (module === SystemModule.DEPARTMENTS || module === SystemModule.SUPPORT) {
        return true;
    }

    // 3. ໂມດູນສະເພາະ: ພະແນກສັນຍາທົ່ວໄປ (Contracts & Contract Types)
    if (module === SystemModule.CONTRACTS || module === SystemModule.CONTRACT_TYPES) {
        return isGeneralContractDivision(user.division);
    }

    // 4. ໂມດູນສະເພາະ: ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contracts)
    if (module === SystemModule.POWER_CONTRACTS) {
        return isPowerContractDivision(user.division);
    }

    // 5. ໂມດູນສະເພາະ: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Documents & Legal Cases)
    if (module === SystemModule.LEGAL_DOCUMENTS || module === SystemModule.LEGAL_CASES) {
        return isLegalAndDisputeDivision(user.division);
    }

    return false;
}

/**
 * ສົ່ງຄືນລາຍຊື່ໂມດູນທັງໝົດທີ່ User ຄົນນີ້ມີສິດເຂົ້າເຖິງ
 */
export function getAccessibleModules(
    user: { role?: UserRole; division?: string | null } | null | undefined,
): SystemModule[] {
    if (!user) return [];

    if (user.role === UserRole.ADMIN) {
        return [
            SystemModule.CONTRACTS,
            SystemModule.CONTRACT_TYPES,
            SystemModule.POWER_CONTRACTS,
            SystemModule.LEGAL_DOCUMENTS,
            SystemModule.LEGAL_CASES,
            SystemModule.DEPARTMENTS,
            SystemModule.USERS,
            SystemModule.AUDIT_LOGS,
            SystemModule.SUPPORT,
        ];
    }

    const modules: SystemModule[] = [SystemModule.DEPARTMENTS, SystemModule.SUPPORT];

    if (isGeneralContractDivision(user.division)) {
        modules.push(SystemModule.CONTRACTS, SystemModule.CONTRACT_TYPES);
    }

    if (isPowerContractDivision(user.division)) {
        modules.push(SystemModule.POWER_CONTRACTS);
    }

    if (isLegalAndDisputeDivision(user.division)) {
        modules.push(SystemModule.LEGAL_DOCUMENTS, SystemModule.LEGAL_CASES);
    }

    return modules;
}

/**
 * ສົ່ງຄືນຊື່ພະແນກທີ່ຕ້ອງການສຳລັບແຕ່ລະໂມດູນ
 */
export function getRequiredDivisionForModule(module: SystemModule): string {
    switch (module) {
        case SystemModule.CONTRACTS:
        case SystemModule.CONTRACT_TYPES:
            return Division.GENERAL_CONTRACT;
        case SystemModule.POWER_CONTRACTS:
            return Division.POWER_CONTRACTS;
        case SystemModule.LEGAL_DOCUMENTS:
        case SystemModule.LEGAL_CASES:
            return Division.LEGAL_AND_DISPUTE;
        case SystemModule.USERS:
        case SystemModule.AUDIT_LOGS:
            return 'Admin Only (ຜູ້ດູແລລະບົບເທົ່ານັ້ນ)';
        case SystemModule.DEPARTMENTS:
        case SystemModule.SUPPORT:
            return 'ທຸກພະແນກ (All Divisions)';
        default:
            return 'Admin Only';
    }
}

/**
 * ວິເຄາະຫາໂມດູນຈາກ HTTP Request URL Path ເພື່ອກວດຈັບການປ່ຽນ Path (Path Tampering)
 */
export function resolveModuleFromPath(rawPath?: string | null): SystemModule | null {
    if (!rawPath) return null;

    let cleanPath = rawPath.split('?')[0].split('#')[0].trim();
    try {
        cleanPath = decodeURIComponent(cleanPath);
    } catch {
        // use cleanPath as-is if malformed percent encoding
    }

    cleanPath = cleanPath.toLowerCase().replace(/\/+/g, '/');
    cleanPath = cleanPath.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) return null;

    const segments = cleanPath.split('/');
    const filteredSegments = segments.filter((s) => !['api', 'v1', 'v2', 'v3'].includes(s));
    if (filteredSegments.length === 0) return null;

    const topSegment = filteredSegments[0];

    switch (topSegment) {
        case 'power-contracts':
        case 'power-notifications':
        case 'power-attachments':
            return SystemModule.POWER_CONTRACTS;

        case 'contract-types':
            return SystemModule.CONTRACT_TYPES;

        case 'contracts':
        case 'notifications':
        case 'attachments':
            return SystemModule.CONTRACTS;

        case 'legal-documents':
        case 'document-attachments':
            return SystemModule.LEGAL_DOCUMENTS;

        case 'legal-cases':
        case 'case-attachments':
            return SystemModule.LEGAL_CASES;

        case 'users':
            if (filteredSegments.includes('change-password')) {
                return null;
            }
            return SystemModule.USERS;

        case 'audit-logs':
            return SystemModule.AUDIT_LOGS;

        case 'departments':
            return SystemModule.DEPARTMENTS;

        case 'support':
            return SystemModule.SUPPORT;

        default:
            return null;
    }
}

/**
 * ບັງຄັບກວດສອບສິດການເຂົ້າເຖິງໂມດູນ ຫາກບໍ່ມີສິດຈະ Throw ForbiddenException ທັນທີ
 */
export function assertCanAccessModule(
    user: { role?: UserRole; division?: string | null } | null | undefined,
    module: SystemModule,
    attemptedPath?: string,
): void {
    if (!user) {
        throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'UNAUTHORIZED_ACCESS',
            message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (Unauthorized)',
            details: { attemptedPath: attemptedPath || null, targetModule: module },
        });
    }

    if (user.role === UserRole.ADMIN) {
        return;
    }

    if (!canAccessModule(user, module)) {
        const requiredDivision = getRequiredDivisionForModule(module);
        throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'PATH_DIVISION_MISMATCH',
            message: `ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນນີ້ ເນື່ອງຈາກສັງກັດພະແນກບໍ່ກົງກັນ (ອະນຸຍາດສະເພາະ: ${requiredDivision})`,
            details: {
                attemptedPath: attemptedPath || null,
                userDivision: user.division || null,
                requiredDivision,
                targetModule: module,
            },
        });
    }
}
