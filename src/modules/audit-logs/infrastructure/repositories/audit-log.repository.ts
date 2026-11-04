import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IAuditLogRepository, AuditLogStats } from '../../domain/repositories/audit-log.repository.interface.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        skip: number;
        take: number;
        search?: string;
        contractId?: string;
        powerContractId?: string;
        userId?: string;
        action?: AuditAction;
        actions?: AuditAction[];
        startDate?: string;
        endDate?: string;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, search, contractId, powerContractId, userId, action, actions, startDate, endDate } = params;

        const whereCondition: any = {};

        if (contractId) {
            whereCondition.contractId = contractId;
        }

        if (powerContractId) {
            whereCondition.powerContractId = powerContractId;
        }

        if (userId) {
            whereCondition.userId = userId;
        }

        if (action) {
            whereCondition.action = action;
        } else if (actions && actions.length > 0) {
            whereCondition.action = { in: actions };
        }

        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereCondition.createdAt.lte = end;
            }
        }

        if (search && search.trim()) {
            const term = search.trim();
            whereCondition.OR = [
                { user: { fullName: { contains: term, mode: 'insensitive' } } },
                { user: { employeeCode: { contains: term, mode: 'insensitive' } } },
                { user: { department: { contains: term, mode: 'insensitive' } } },
                { contract: { title: { contains: term, mode: 'insensitive' } } },
                { contract: { contractNumber: { contains: term, mode: 'insensitive' } } },
                { powerContract: { projectName: { contains: term, mode: 'insensitive' } } },
                { powerContract: { contractNumber: { contains: term, mode: 'insensitive' } } },
                { ipAddress: { contains: term, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, fullName: true, employeeCode: true, department: true } },
                    contract: { select: { id: true, title: true, contractNumber: true } },
                    powerContract: { select: { id: true, projectName: true, contractNumber: true } },
                },
            }),
            this.prisma.auditLog.count({ where: whereCondition }),
        ]);

        return { data, total };
    }

    async getStats(): Promise<AuditLogStats> {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [totalLogs, todayLogs, grouped] = await this.prisma.$transaction([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({
                where: {
                    createdAt: { gte: startOfToday },
                },
            }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                _count: { id: true },
            }),
        ]);

        const actionCounts: Record<string, number> = {};
        for (const item of grouped) {
            actionCounts[item.action] = item._count.id;
        }

        const countOf = (...actions: AuditAction[]) =>
            actions.reduce((sum, a) => sum + (actionCounts[a] || 0), 0);

        return {
            totalLogs,
            todayLogs,
            securityChanges: countOf(AuditAction.USER_PERMISSION_CHANGE),
            contractChanges: countOf(
                AuditAction.CREATE_CONTRACT,
                AuditAction.UPDATE_CONTRACT,
                AuditAction.DELETE_CONTRACT,
                AuditAction.CREATE_POWER_CONTRACT,
                AuditAction.UPDATE_POWER_CONTRACT,
                AuditAction.DELETE_POWER_CONTRACT,
            ),
            legalChanges: countOf(
                AuditAction.CREATE_LEGAL_DOCUMENT,
                AuditAction.UPDATE_LEGAL_DOCUMENT,
                AuditAction.DELETE_LEGAL_DOCUMENT,
                AuditAction.CREATE_LEGAL_CASE,
                AuditAction.UPDATE_LEGAL_CASE,
                AuditAction.DELETE_LEGAL_CASE,
            ),
            attachmentActions: countOf(
                AuditAction.UPLOAD_ATTACHMENT,
                AuditAction.DOWNLOAD_ATTACHMENT,
                AuditAction.DELETE_ATTACHMENT,
                AuditAction.UPLOAD_POWER_ATTACHMENT,
                AuditAction.DOWNLOAD_POWER_ATTACHMENT,
                AuditAction.DELETE_POWER_ATTACHMENT,
            ),
            roleChanges: countOf(
                AuditAction.CREATE_ROLE,
                AuditAction.UPDATE_ROLE,
                AuditAction.DELETE_ROLE,
            ),
        };
    }
}
