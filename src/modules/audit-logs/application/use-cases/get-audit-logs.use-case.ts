import { Injectable, Inject } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import * as auditLogRepoInterface from '../../domain/repositories/audit-log.repository.interface.js';

@Injectable()
export class GetAuditLogsUseCase {
    constructor(
        @Inject(auditLogRepoInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepo: auditLogRepoInterface.IAuditLogRepository,
    ) { }

    async execute(query: {
        page?: number;
        limit?: number;
        contractId?: string;
        userId?: string;
        action?: AuditAction;
    }) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;

        const result = await this.auditLogRepo.findAll({
            skip,
            take: limit,
            contractId: query.contractId,
            userId: query.userId,
            action: query.action,
        });

        return {
            message: 'ດຶງປະຫວັດ Audit Logs ສຳເລັດ',
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
            data: result.data,
        };
    }
}
