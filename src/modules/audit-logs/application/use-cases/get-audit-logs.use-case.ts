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
        search?: string;
        contractId?: string;
        powerContractId?: string;
        userId?: string;
        action?: AuditAction;
        category?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;

        let actions: AuditAction[] | undefined = undefined;
        if (query.category) {
            const cat = query.category.toUpperCase();
            if (cat === 'SECURITY') {
                actions = [AuditAction.USER_PERMISSION_CHANGE];
            } else if (cat === 'CONTRACTS') {
                actions = [
                    AuditAction.CREATE_CONTRACT,
                    AuditAction.UPDATE_CONTRACT,
                    AuditAction.DELETE_CONTRACT,
                ];
            } else if (cat === 'POWER_CONTRACTS') {
                actions = [
                    AuditAction.CREATE_POWER_CONTRACT,
                    AuditAction.UPDATE_POWER_CONTRACT,
                    AuditAction.DELETE_POWER_CONTRACT,
                ];
            } else if (cat === 'LEGAL') {
                actions = [
                    AuditAction.CREATE_LEGAL_DOCUMENT,
                    AuditAction.UPDATE_LEGAL_DOCUMENT,
                    AuditAction.DELETE_LEGAL_DOCUMENT,
                    AuditAction.CREATE_LEGAL_CASE,
                    AuditAction.UPDATE_LEGAL_CASE,
                    AuditAction.DELETE_LEGAL_CASE,
                ];
            } else if (cat === 'ATTACHMENTS') {
                actions = [
                    AuditAction.UPLOAD_ATTACHMENT,
                    AuditAction.DOWNLOAD_ATTACHMENT,
                    AuditAction.DELETE_ATTACHMENT,
                    AuditAction.UPLOAD_POWER_ATTACHMENT,
                    AuditAction.DOWNLOAD_POWER_ATTACHMENT,
                    AuditAction.DELETE_POWER_ATTACHMENT,
                ];
            } else if (cat === 'ROLES') {
                actions = [
                    AuditAction.CREATE_ROLE,
                    AuditAction.UPDATE_ROLE,
                    AuditAction.DELETE_ROLE,
                ];
            }
        }

        const result = await this.auditLogRepo.findAll({
            skip,
            take: limit,
            search: query.search,
            contractId: query.contractId,
            powerContractId: query.powerContractId,
            userId: query.userId,
            action: query.action,
            actions,
            startDate: query.startDate,
            endDate: query.endDate,
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

    async getStats() {
        const stats = await this.auditLogRepo.getStats();
        return {
            message: 'ດຶງສະຖິຕິ Audit Logs ສຳເລັດ',
            data: stats,
        };
    }
}
