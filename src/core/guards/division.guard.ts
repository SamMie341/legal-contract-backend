import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditAction, UserRole } from '@prisma/client';
import { REQUIRED_MODULE_KEY } from '../decorators/required-module.decorator.js';
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
        const httpMethod = req?.method || 'UNKNOWN';
        const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
        const user = req?.user;

        // 1. ອ່ານຄ່າ Module ທີ່ຖືກກຳນົດຈາກ @RequiredModule() ຜ່ານ decorator
        const metadataModule = this.reflector.getAllAndOverride<SystemModule>(REQUIRED_MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 2. ກວດສອບໂມດູນຈາກ URL Path ທີ່ຖືກ Request ເຂົ້າມາ (ດັກຈັບການປ່ຽນ Path / Path Tampering)
        const pathModule = resolveModuleFromPath(requestedPath);

        // ລວບລວມໂມດູນທີ່ຕ້ອງກວດສອບ
        const modulesToCheck = new Set<SystemModule>();
        if (metadataModule) modulesToCheck.add(metadataModule);
        if (pathModule) modulesToCheck.add(pathModule);

        // ຫາກບໍ່ມີທັງ @RequiredModule() ແລະ ບໍ່ກົງກັບໂມດູນສະເພາະໃດໆ ໃຫ້ຜ່ານໄດ້
        if (modulesToCheck.size === 0) {
            return true;
        }

        // 3. Admin ສາມາດເຂົ້າເຖິງໄດ້ທຸກໂມດູນ
        if (user?.role === UserRole.ADMIN) {
            return true;
        }

        // 4. ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມ Division ຂອງ User
        for (const targetModule of modulesToCheck) {
            const hasAccess = canAccessModule(user, targetModule);

            if (!hasAccess) {
                const requiredDivision = getRequiredDivisionForModule(targetModule);
                const userDivision = user?.division || 'ບໍ່ມີຂໍ້ມູນພະແນກ (None)';
                const userId = user?.userId || user?.id;
                const username = user?.username || 'Unknown';

                // ບັນທຶກ Security Alert ເຕືອນໄພໃນ Console
                console.warn(
                    `🚨 [SecurityAlert: Path Tampering Detected] User "${username}" (ID: ${userId || 'N/A'}, Division: "${userDivision}") attempted unauthorized cross-division access to path: "${requestedPath}" [${httpMethod}]. Required Division: "${requiredDivision}". Target Module: "${targetModule}". Access blocked.`,
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
                    message: `ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໂມດູນນີ້ ເນື່ອງຈາກສັງກັດພະແນກບໍ່ກົງກັນ (ອະນຸຍາດສະເພາະ: ${requiredDivision})`,
                    details: {
                        attemptedPath: requestedPath,
                        userDivision: user?.division || null,
                        requiredDivision,
                        targetModule,
                    },
                });
            }
        }

        return true;
    }
}
