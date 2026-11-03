import { ForbiddenException } from '@nestjs/common';
import { UserRole, SystemModule as PrismaSystemModule } from '@prisma/client';
import { Division, SystemModule } from '../constants/division.constant.js';

export type PermissionAction = 'canView' | 'canUpload' | 'canEdit' | 'canDelete' | 'canDownload';

export interface UserModulePermItem {
    module: SystemModule | string;
    canView?: boolean;
    canUpload?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDownload?: boolean;
}

export interface RoleRefInfo {
    id?: string;
    name?: string;
    title?: string;
    permissions?: UserModulePermItem[];
}

export interface PermissionUserContext {
    role?: UserRole | string | null;
    roleId?: string | null;
    roleRef?: RoleRefInfo | null;
    division?: string | null;
    canView?: boolean;
    canUpload?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDownload?: boolean;
    modulePermissions?: UserModulePermItem[];
    permissionsByModule?: Record<string, { canView?: boolean; canUpload?: boolean; canEdit?: boolean; canDelete?: boolean; canDownload?: boolean }>;
    accessibleModules?: (SystemModule | string)[];
}

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
 * ສົ່ງຄືນໂມດູນຫຼັກເລີ່ມຕົ້ນຕາມພະແນກຕົ້ນສັງກັດ (Home Division Modules)
 */
export function getDefaultModulesByDivision(division?: string | null): SystemModule[] {
    if (isPowerContractDivision(division)) {
        return [SystemModule.POWER_CONTRACTS];
    }
    if (isGeneralContractDivision(division)) {
        return [SystemModule.CONTRACTS, SystemModule.CONTRACT_TYPES];
    }
    if (isLegalAndDisputeDivision(division)) {
        return [SystemModule.LEGAL_DOCUMENTS, SystemModule.LEGAL_CASES];
    }
    return [];
}

/**
 * ແປງຊື່ Module ຈາກຮູບແບບຕ່າງໆ (String, Path, Kebab, Lowercase, Combined Pillar)
 * ໃຫ້ເປັນ Prisma SystemModule Enum ທີ່ຖືກຕ້ອງສຳລັບບັນທຶກລົງ Database
 */
export function resolveToPrismaModules(moduleInput: any): PrismaSystemModule[] {
    if (!moduleInput) return [];
    const raw = String(moduleInput).toUpperCase().replace(/-/g, '_').trim();
    if (raw === 'CONTRACTS' || raw === 'CONTRACT_TYPES') {
        return [PrismaSystemModule.CONTRACTS];
    }
    if (raw === 'POWER_CONTRACTS') {
        return [PrismaSystemModule.POWER_CONTRACTS];
    }
    if (raw === 'LEGAL_DOCUMENTS') {
        return [PrismaSystemModule.LEGAL_DOCUMENTS];
    }
    if (raw === 'LEGAL_CASES') {
        return [PrismaSystemModule.LEGAL_CASES];
    }
    if (raw === 'LEGAL_AND_DISPUTE') {
        return [PrismaSystemModule.LEGAL_DOCUMENTS, PrismaSystemModule.LEGAL_CASES];
    }
    return [];
}

/**
 * ສ້າງ Matrix ສິດເລີ່ມຕົ້ນຕາມ Role ແລະ Division
 */
export function buildDefaultPermissionsForRole(role?: UserRole | string | null, division?: string | null) {
    const allCore = [
        PrismaSystemModule.CONTRACTS,
        PrismaSystemModule.POWER_CONTRACTS,
        PrismaSystemModule.LEGAL_DOCUMENTS,
        PrismaSystemModule.LEGAL_CASES,
    ];

    const roleName = String(role || '').toUpperCase();

    if (roleName === 'ADMIN') {
        return allCore.map((module) => ({
            module,
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
        }));
    }

    if (roleName === 'DEPARTMENT_HEAD') {
        return allCore.map((module) => ({
            module,
            canView: true,
            canUpload: false,
            canEdit: false,
            canDelete: false,
            canDownload: true,
        }));
    }

    const homeModules: PrismaSystemModule[] = [];
    if (isPowerContractDivision(division)) {
        homeModules.push(PrismaSystemModule.POWER_CONTRACTS);
    } else if (isGeneralContractDivision(division)) {
        homeModules.push(PrismaSystemModule.CONTRACTS);
    } else if (isLegalAndDisputeDivision(division)) {
        homeModules.push(PrismaSystemModule.LEGAL_DOCUMENTS, PrismaSystemModule.LEGAL_CASES);
    }

    const isFullManage = roleName === 'DIVISION_HEAD' || roleName === 'MAIN_USER';
    const isEditor = roleName === 'EDITOR';

    return homeModules.map((module) => ({
        module,
        canView: true,
        canUpload: isFullManage || isEditor,
        canEdit: isFullManage || isEditor,
        canDelete: isFullManage,
        canDownload: isFullManage || isEditor,
    }));
}

/**
 * ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມ Module-Scoped RBAC & Action
 */
export function canAccessModule(
    user: PermissionUserContext | null | undefined,
    module: SystemModule,
    action: PermissionAction = 'canView',
): boolean {
    if (!user) return false;

    const roleName = String(user.roleRef?.name || user.role || '').toUpperCase();

    // 1. Admin ສາມາດເຂົ້າເຖິງໄດ້ທຸກໂມດູນ ແລະ ທຸກ Action
    if (roleName === 'ADMIN') {
        return true;
    }

    // 2. ໂມດູນກາງທີ່ທຸກພະແນກໃຊ້ຮ່ວມກັນໄດ້ (Master Data / Dropdown / Support)
    if (module === SystemModule.DEPARTMENTS || module === SystemModule.SUPPORT) {
        return true;
    }

    // 3. ລະດັບຝ່າຍ (DEPARTMENT_HEAD): ສາມາດເຂົ້າເບິ່ງ (canView) ແລະ ດາວໂຫຼດ (canDownload) ໄດ້ທຸກໂມດູນຫຼັກ
    if (roleName === 'DEPARTMENT_HEAD' && (action === 'canView' || action === 'canDownload')) {
        return true;
    }

    let targetKey = String(module).toUpperCase().replace(/-/g, '_');
    if (targetKey === 'CONTRACT_TYPES') targetKey = 'CONTRACTS';
    if (targetKey === 'LEGAL_AND_DISPUTE') {
        return canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, action) ||
            canAccessModule(user, SystemModule.LEGAL_CASES, action);
    }

    // 3.5. ກວດສອບຈາກ user.permissionsByModule (Pure Stateless JWT Payload)
    if (user.permissionsByModule && typeof user.permissionsByModule === 'object') {
        let modPerm =
            user.permissionsByModule[targetKey] ||
            user.permissionsByModule[String(module)];

        if (!modPerm && (targetKey === 'LEGAL_DOCUMENTS' || targetKey === 'LEGAL_CASES')) {
            modPerm = user.permissionsByModule['LEGAL_AND_DISPUTE'] || user.permissionsByModule['legal-and-dispute'];
        }

        if (modPerm && typeof modPerm === 'object' && modPerm[action] !== undefined) {
            return Boolean(modPerm[action]);
        }
    }

    // 4. ກວດສອບຈາກ user.modulePermissions (Matrix ສິດສະເພາະບຸກຄົນ - User-Level Overrides)
    if (user.modulePermissions && user.modulePermissions.length > 0) {
        const perm = user.modulePermissions.find((p) => {
            const k = String(p.module).toUpperCase().replace(/-/g, '_');
            return k === targetKey || (k === 'LEGAL_AND_DISPUTE' && (targetKey === 'LEGAL_DOCUMENTS' || targetKey === 'LEGAL_CASES'));
        });

        if (perm) {
            return Boolean(perm[action]);
        }
    }

    // 5. ກວດສອບຈາກ Role-Level Matrix (user.roleRef.permissions ຈາກ Custom Role)
    if (user.roleRef?.permissions && user.roleRef.permissions.length > 0) {
        const rolePerm = user.roleRef.permissions.find((p) => {
            const k = String(p.module).toUpperCase().replace(/-/g, '_');
            return k === targetKey || (k === 'LEGAL_AND_DISPUTE' && (targetKey === 'LEGAL_DOCUMENTS' || targetKey === 'LEGAL_CASES'));
        });

        if (rolePerm) {
            return Boolean(rolePerm[action]);
        }
    }

    // 6. Fallback ກັບ Home Division ແລະ Legacy Flags (ຮອງຮັບຄວາມເຂົ້າກັນໄດ້ຍ້ອນຫຼັງ)
    let isHomeDivision = false;
    if (module === SystemModule.CONTRACTS || module === SystemModule.CONTRACT_TYPES) {
        isHomeDivision = isGeneralContractDivision(user.division);
    } else if (module === SystemModule.POWER_CONTRACTS) {
        isHomeDivision = isPowerContractDivision(user.division);
    } else if (module === SystemModule.LEGAL_DOCUMENTS || module === SystemModule.LEGAL_CASES) {
        isHomeDivision = isLegalAndDisputeDivision(user.division);
    }

    if (!isHomeDivision) {
        return false;
    }

    if (roleName === 'DIVISION_HEAD' || roleName === 'MAIN_USER') {
        return true;
    }

    if (roleName === 'EDITOR') {
        if (action === 'canDelete') return user.canDelete === true;
        return true;
    }

    if (roleName === 'VIEWER') {
        if (action === 'canView') return user.canView !== false;
        return Boolean(user[action as keyof PermissionUserContext]);
    }

    return Boolean(user[action as keyof PermissionUserContext]);
}

/**
 * ສົ່ງຄືນລາຍຊື່ໂມດູນທັງໝົດທີ່ User ຄົນນີ້ມີສິດເຂົ້າເຖິງ
 */
export function getAccessibleModules(
    user: PermissionUserContext | null | undefined,
): SystemModule[] {
    if (!user) return [];

    const roleName = String(user.roleRef?.name || user.role || '').toUpperCase();

    if (roleName === 'ADMIN') {
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

    const modules = new Set<SystemModule>([SystemModule.DEPARTMENTS, SystemModule.SUPPORT]);

    if (roleName === 'DEPARTMENT_HEAD') {
        modules.add(SystemModule.CONTRACTS);
        modules.add(SystemModule.CONTRACT_TYPES);
        modules.add(SystemModule.POWER_CONTRACTS);
        modules.add(SystemModule.LEGAL_DOCUMENTS);
        modules.add(SystemModule.LEGAL_CASES);
        return Array.from(modules);
    }

    // 1. Module Permissions ລະດັບ User
    if (user.modulePermissions && user.modulePermissions.length > 0) {
        for (const p of user.modulePermissions) {
            if (p.canView !== false) {
                const modKey = String(p.module).toUpperCase().replace(/-/g, '_');
                if (modKey === 'CONTRACTS') {
                    modules.add(SystemModule.CONTRACTS);
                    modules.add(SystemModule.CONTRACT_TYPES);
                } else if (modKey === 'POWER_CONTRACTS') {
                    modules.add(SystemModule.POWER_CONTRACTS);
                } else if (modKey === 'LEGAL_DOCUMENTS') {
                    modules.add(SystemModule.LEGAL_DOCUMENTS);
                } else if (modKey === 'LEGAL_CASES') {
                    modules.add(SystemModule.LEGAL_CASES);
                } else if (modKey === 'LEGAL_AND_DISPUTE') {
                    modules.add(SystemModule.LEGAL_DOCUMENTS);
                    modules.add(SystemModule.LEGAL_CASES);
                }
            }
        }
    }

    // 2. Module Permissions ຈາກ Role
    if (user.roleRef?.permissions && user.roleRef.permissions.length > 0) {
        for (const p of user.roleRef.permissions) {
            if (p.canView !== false) {
                const modKey = String(p.module).toUpperCase().replace(/-/g, '_');
                if (modKey === 'CONTRACTS') {
                    modules.add(SystemModule.CONTRACTS);
                    modules.add(SystemModule.CONTRACT_TYPES);
                } else if (modKey === 'POWER_CONTRACTS') {
                    modules.add(SystemModule.POWER_CONTRACTS);
                } else if (modKey === 'LEGAL_DOCUMENTS') {
                    modules.add(SystemModule.LEGAL_DOCUMENTS);
                } else if (modKey === 'LEGAL_CASES') {
                    modules.add(SystemModule.LEGAL_CASES);
                } else if (modKey === 'LEGAL_AND_DISPUTE') {
                    modules.add(SystemModule.LEGAL_DOCUMENTS);
                    modules.add(SystemModule.LEGAL_CASES);
                }
            }
        }
    }

    // 3. Fallback ກັບ Home Division ຫາກບໍ່ມີທັງສອງ
    if ((!user.modulePermissions || user.modulePermissions.length === 0) &&
        (!user.roleRef?.permissions || user.roleRef.permissions.length === 0)) {
        if (isGeneralContractDivision(user.division)) {
            modules.add(SystemModule.CONTRACTS);
            modules.add(SystemModule.CONTRACT_TYPES);
        }
        if (isPowerContractDivision(user.division)) {
            modules.add(SystemModule.POWER_CONTRACTS);
        }
        if (isLegalAndDisputeDivision(user.division)) {
            modules.add(SystemModule.LEGAL_DOCUMENTS);
            modules.add(SystemModule.LEGAL_CASES);
        }
    }

    if (modules.has(SystemModule.LEGAL_DOCUMENTS) || modules.has(SystemModule.LEGAL_CASES)) {
        modules.add('LEGAL_AND_DISPUTE' as any);
    }

    return Array.from(modules);
}

/**
 * ສົ່ງຄືນ Object ສະຫຼຸບສິດລາຍໂມດູນ (permissionsByModule) ສຳລັບສົ່ງໃຫ້ Frontend
 */
export function getPermissionsByModule(
    user: PermissionUserContext | null | undefined,
): Record<string, { canView: boolean; canUpload: boolean; canEdit: boolean; canDelete: boolean; canDownload: boolean }> {
    const modules = [
        SystemModule.CONTRACTS,
        SystemModule.POWER_CONTRACTS,
        SystemModule.LEGAL_DOCUMENTS,
        SystemModule.LEGAL_CASES,
    ];

    const actions: PermissionAction[] = ['canView', 'canUpload', 'canEdit', 'canDelete', 'canDownload'];
    const result: Record<string, any> = {};

    for (const mod of modules) {
        const modKey = String(mod).toUpperCase().replace(/-/g, '_');
        const perms: Record<string, boolean> = {};
        for (const act of actions) {
            perms[act] = canAccessModule(user, mod, act);
        }
        result[modKey] = perms;
        result[mod] = perms;
    }

    // ຮອງຮັບ Pillar ທີ 3: ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (LEGAL_AND_DISPUTE)
    // ລວມສິດທັງ 2 ວຽກງານ (LEGAL_DOCUMENTS + LEGAL_CASES) ໃຫ້ Frontend ໃຊ້ງານງ່າຍຂຶ້ນ
    const legalDisputePerms: Record<string, boolean> = {
        canView: Boolean(result['LEGAL_DOCUMENTS']?.canView || result['LEGAL_CASES']?.canView),
        canUpload: Boolean(result['LEGAL_DOCUMENTS']?.canUpload || result['LEGAL_CASES']?.canUpload),
        canEdit: Boolean(result['LEGAL_DOCUMENTS']?.canEdit || result['LEGAL_CASES']?.canEdit),
        canDelete: Boolean(result['LEGAL_DOCUMENTS']?.canDelete || result['LEGAL_CASES']?.canDelete),
        canDownload: Boolean(result['LEGAL_DOCUMENTS']?.canDownload || result['LEGAL_CASES']?.canDownload),
    };
    result['LEGAL_AND_DISPUTE'] = legalDisputePerms;
    result['legal-and-dispute'] = legalDisputePerms;

    return result;
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
    user: {
        role?: UserRole;
        division?: string | null;
        canView?: boolean;
        canUpload?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
        canDownload?: boolean;
        modulePermissions?: UserModulePermItem[];
    } | null | undefined,
    module: SystemModule,
    attemptedPath?: string,
    action: PermissionAction = 'canView',
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

    if (!canAccessModule(user, module, action)) {
        const requiredDivision = getRequiredDivisionForModule(module);
        throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'PATH_DIVISION_MISMATCH',
            message: `ທ່ານບໍ່ມີສິດ (${action}) ໃນໂມດູນນີ້ (ອະນຸຍາດສະເພາະ: ${requiredDivision} ຫຼື ຜູ້ໄດ້ຮັບສິດພິເສດ)`,
            details: {
                attemptedPath: attemptedPath || null,
                userDivision: user.division || null,
                requiredDivision,
                targetModule: module,
                action,
            },
        });
    }
}
