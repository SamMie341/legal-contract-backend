import { Module } from '@nestjs/common';
import { AuditLogsController } from './presentation/audit-logs.controller.js';
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs.use-case.js';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository.js';

@Module({
    controllers: [AuditLogsController],
    providers: [
        GetAuditLogsUseCase,
        {
            provide: AUDIT_LOG_REPOSITORY,
            useClass: AuditLogRepository,
        },
    ],
    exports: [AUDIT_LOG_REPOSITORY],
})
export class AuditLogsModule { }
