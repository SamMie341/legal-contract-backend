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
 * ບັງຄັບກວດສອບສິດການເຂົ້າເຖິງໂມດູນ ຫາກບໍ່ມີສິດຈະ Throw ForbiddenException ທັນທີ
 */
export function assertCanAccessModule(
    user: { role?: UserRole; division?: string | null } | null | undefined,
    module: SystemModule,
): void {
    if (!user) {
        throw new ForbiddenException('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (Unauthorized)');
    }

    if (user.role === UserRole.ADMIN) {
        return;
    }

    if (!canAccessModule(user, module)) {
        if (module === SystemModule.CONTRACTS || module === SystemModule.CONTRACT_TYPES) {
            throw new ForbiddenException(
                `ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນສັນຍາ (ອະນຸຍາດສະເພາະ ${Division.GENERAL_CONTRACT})`,
            );
        }

        if (module === SystemModule.POWER_CONTRACTS) {
            throw new ForbiddenException(
                `ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນສັນຍາຊື້-ຂາຍໄຟຟ້າ (ອະນຸຍາດສະເພາະ ${Division.POWER_CONTRACTS})`,
            );
        }

        if (module === SystemModule.LEGAL_DOCUMENTS || module === SystemModule.LEGAL_CASES) {
            throw new ForbiddenException(
                `ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນນີ້ (ອະນຸຍາດສະເພາະ ${Division.LEGAL_AND_DISPUTE})`,
            );
        }

        throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນນີ້ (Forbidden: Access Denied)');
    }
}
