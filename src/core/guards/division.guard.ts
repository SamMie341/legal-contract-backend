import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditAction } from '@prisma/client';
import { REQUIRED_MODULE_KEY } from '../decorators/required-module.decorator.js';
import { MODULE_ACCESS_KEY, ModuleAccessRequirement, PermissionAction } from '../decorators/require-access.decorator.js';
import { SystemModule } from '../constants/division.constant.js';
import {
    canAccessModule,
    getRequiredDivisionForModule,
    resolveModuleFromPath,
} from '../utils/division-helper.util.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

@Injectable()
export class DivisionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Optional() private readonly prisma?: PrismaService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const requestedPath = req?.originalUrl || req?.url || req?.path || '';
        const httpMethod = (req?.method || 'GET').toUpperCase();
        const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
        const user = req?.user;

        // 1. ອ່ານຄ່າ Module & Action ທີ່ຖືກກຳນົດຈາກ @RequireAccess() (Granular Action)
        const accessRequirement = this.reflector.getAllAndOverride<ModuleAccessRequirement>(MODULE_ACCESS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 2. ອ່ານຄ່າ Module ທີ່ຖືກກຳນົດຈາກ @RequiredModule() (Class / Handler level)
        const metadataModule = this.reflector.getAllAndOverride<SystemModule>(REQUIRED_MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 3. ກວດສອບໂມດູນຈາກ URL Path ທີ່ຖືກ Request ເຂົ້າມາ (ດັກຈັບການປ່ຽນ Path / Path Tampering)
        const pathModule = resolveModuleFromPath(requestedPath);

        // 4. ກຳນົດ Action ທີ່ຕ້ອງການ
        let requiredAction: PermissionAction = 'canView';
        if (accessRequirement?.action) {
            requiredAction = accessRequirement.action;
        } else {
            // Infer action from HTTP method
            if (httpMethod === 'POST') requiredAction = 'canUpload';
            else if (httpMethod === 'PATCH' || httpMethod === 'PUT') requiredAction = 'canEdit';
            else if (httpMethod === 'DELETE') requiredAction = 'canDelete';
            else requiredAction = 'canView';
        }

        // ລວບລວມໂມດູນທີ່ຕ້ອງກວດສອບ
        const modulesToCheck = new Set<SystemModule>();
        if (accessRequirement?.module) {
            modulesToCheck.add(accessRequirement.module as any);
        }
        if (metadataModule) {
            modulesToCheck.add(metadataModule);
        }
        if (pathModule) {
            modulesToCheck.add(pathModule);
        }

        // ຫາກບໍ່ມີທັງ @RequireAccess(), @RequiredModule() ແລະ ບໍ່ກົງກັບໂມດູນສະເພາະໃດໆ ໃຫ້ຜ່ານໄດ້
        if (modulesToCheck.size === 0) {
            return true;
        }

        // 5. Admin ສາມາດເຂົ້າເຖິງໄດ້ທຸກໂມດູນ ແລະ ທຸກ Action
        const roleName = String(user?.roleRef?.name || user?.role || '').toUpperCase();
        if (roleName === 'ADMIN') {
            return true;
        }

        // 6. ລະດັບຝ່າຍ (DEPARTMENT_HEAD) ສາມາດເຂົ້າເບິ່ງ (canView) ແລະ ດາວໂຫຼດ (canDownload) ໄດ້ທຸກໂມດູນຫຼັກ
        if (roleName === 'DEPARTMENT_HEAD' && (requiredAction === 'canView' || requiredAction === 'canDownload')) {
            return true;
        }

        // 7. ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມ Module-Scoped RBAC & Division ຂອງ User
        for (const targetModule of modulesToCheck) {
            const hasAccess = canAccessModule(user, targetModule, requiredAction);

            if (!hasAccess) {
                const requiredDivision = getRequiredDivisionForModule(targetModule);
                const userDivision = user?.division || 'ບໍ່ມີຂໍ້ມູນພະແນກ (None)';
                const userId = user?.userId || user?.id;
                const username = user?.username || 'Unknown';

                // ບັນທຶກ Security Alert ເຕືອນໄພໃນ Console
                console.warn(
                    `🚨 [SecurityAlert: Path Tampering / Unauthorized Access Detected] User "${username}" (ID: ${userId || 'N/A'}, Division: "${userDivision}") attempted unauthorized access to path: "${requestedPath}" [${httpMethod}]. Required: "${targetModule}" (${requiredAction}). Access blocked.`,
                );

                // ບັນທຶກ Audit Log ລົງ Database ແບບ Asynchronous (ຫາກມີ PrismaService ແລະ User ID)
                if (this.prisma && userId) {
                    this.prisma.auditLog
                        .create({
                            data: {
                                userId,
                                action: AuditAction.USER_PERMISSION_CHANGE,
                                oldValues: {
                                    userDivision: user?.division || null,
                                    userRole: user?.role || null,
                                },
                                newValues: {
                                    alertType: 'PATH_TAMPERING_DETECTED',
                                    attemptedPath: requestedPath,
                                    httpMethod,
                                    requiredDivision,
                                    targetModule,
                                    requiredAction,
                                    ipAddress,
                                },
                                ipAddress,
                            },
                        })
                        .catch((err) => {
                            console.error('Failed to record security audit log for path tampering:', err);
                        });
                }

                // ຖິ້ມ ForbiddenException ພ້ອມລາຍລະອຽດໂຄງສ້າງ PATH_DIVISION_MISMATCH
                throw new ForbiddenException({
                    statusCode: 403,
                    error: 'Forbidden',
                    code: 'PATH_DIVISION_MISMATCH',
                    message: `ທ່ານບໍ່ມີສິດ (${requiredAction}) ໃນໂມດູນນີ້ (ອະນຸຍາດສະເພາະ: ${requiredDivision} ຫຼື ຜູ້ໄດ້ຮັບສິດພິເສດ)`,
                    details: {
                        attemptedPath: requestedPath,
                        userDivision: user?.division || null,
                        requiredDivision,
                        targetModule,
                        requiredAction,
                    },
                });
            }
        }

        return true;
    }
}

// Alias for clean architecture and backward compatibility
export { DivisionGuard as ModuleAccessGuard };
