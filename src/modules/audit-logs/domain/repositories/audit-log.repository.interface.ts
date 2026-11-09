import { AuditAction } from '@prisma/client';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface AuditLogStats {
    totalLogs: number;
    securityChanges: number;
    contractChanges: number;
    legalChanges: number;
    attachmentActions: number;
    roleChanges: number;
    todayLogs: number;
}

export interface IAuditLogRepository {
    findAll(params: {
        skip: number;
        take: number;
        search?: string;
        contractId?: string;
        powerContractId?: string;
        userId?: string;
        targetUserId?: string;
        action?: AuditAction;
        actions?: AuditAction[];
        startDate?: string;
        endDate?: string;
    }): Promise<{ data: any[]; total: number }>;

    getStats(): Promise<AuditLogStats>;
}
