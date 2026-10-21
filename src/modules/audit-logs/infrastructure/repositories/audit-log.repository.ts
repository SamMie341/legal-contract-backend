import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        skip: number;
        take: number;
        contractId?: string;
        userId?: string;
        action?: AuditAction;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, contractId, userId, action } = params;

        const whereCondition: any = {};

        if (contractId) {
            whereCondition.contractId = contractId;
        }

        if (userId) {
            whereCondition.userId = userId;
        }

        if (action) {
            whereCondition.action = action;
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { fullName: true, employeeCode: true, department: true } },
                    contract: { select: { title: true, contractNumber: true } },
                },
            }),
            this.prisma.auditLog.count({ where: whereCondition }),
        ]);

        return { data, total };
    }
}
