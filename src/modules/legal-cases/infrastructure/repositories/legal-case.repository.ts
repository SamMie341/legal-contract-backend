import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, DisputeStatus, LegalCase } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import {
    FindAllLegalCasesParams,
    ILegalCaseRepository,
    LegalCaseDashboardStats,
} from '../../domain/repositories/legal-case.repository.interface.js';

@Injectable()
export class LegalCaseRepository implements ILegalCaseRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: FindAllLegalCasesParams): Promise<{ data: any[]; total: number }> {
        const { skip = 0, take = 10, search, caseType, disputeStatus, departmentId, startDate, endDate } = params;

        const whereCondition: any = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                { caseCode: { contains: search, mode: 'insensitive' } },
                { defendant: { contains: search, mode: 'insensitive' } },
                { allegation: { contains: search, mode: 'insensitive' } },
                { departmentAction: { contains: search, mode: 'insensitive' } },
                { disputeProgress: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (caseType) {
            whereCondition.caseType = caseType;
        }

        if (disputeStatus) {
            whereCondition.disputeStatus = disputeStatus;
        }

        if (departmentId) {
            whereCondition.departmentId = departmentId;
        }

        if (startDate || endDate) {
            whereCondition.date = {};
            if (startDate) whereCondition.date.gte = new Date(startDate);
            if (endDate) whereCondition.date.lte = new Date(endDate);
        }

        const [total, data] = await Promise.all([
            this.prisma.legalCase.count({ where: whereCondition }),
            this.prisma.legalCase.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    department: { select: { id: true, name: true, code: true } },
                    attachments: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            fileName: true,
                            fileUrl: true,
                            fileType: true,
                            fileSize: true,
                            createdAt: true,
                        },
                    },
                    createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                    updatedBy: { select: { id: true, fullName: true, employeeCode: true } },
                },
            }),
        ]);

        return { data, total };
    }

    async findById(idOrCode: string): Promise<any | null> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrCode);
        const whereClause = isUuid
            ? { internalId: idOrCode, deletedAt: null }
            : { caseCode: idOrCode, deletedAt: null };

        return this.prisma.legalCase.findFirst({
            where: whereClause,
            include: {
                department: { select: { id: true, name: true, code: true } },
                attachments: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        fileType: true,
                        fileSize: true,
                        uploadedById: true,
                        createdAt: true,
                        uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
                    },
                },
                createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                updatedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async findByCode(caseCode: string, excludeInternalId?: string): Promise<LegalCase | null> {
        return this.prisma.legalCase.findFirst({
            where: {
                caseCode,
                deletedAt: null,
                ...(excludeInternalId ? { internalId: { not: excludeInternalId } } : {}),
            },
        });
    }

    async createWithAudit(data: any, userId: string): Promise<LegalCase> {
        return this.prisma.$transaction(async (tx) => {
            const created = await tx.legalCase.create({
                data: {
                    ...data,
                    createdById: userId,
                    updatedById: userId,
                },
                include: {
                    department: { select: { id: true, name: true, code: true } },
                    createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.CREATE_LEGAL_CASE,
                    newValues: {
                        internalId: created.internalId,
                        caseCode: created.caseCode,
                        defendant: created.defendant,
                        caseType: created.caseType,
                        disputeStatus: created.disputeStatus,
                    },
                },
            });

            return created;
        });
    }

    async updateWithAudit(internalId: string, data: any, userId: string): Promise<LegalCase> {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.legalCase.findFirst({
                where: { internalId, deletedAt: null },
            });

            if (!existing) {
                throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ (Legal Case not found)');
            }

            const updated = await tx.legalCase.update({
                where: { internalId },
                data: {
                    ...data,
                    updatedById: userId,
                },
                include: {
                    department: { select: { id: true, name: true, code: true } },
                    createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                    updatedBy: { select: { id: true, fullName: true, employeeCode: true } },
                    attachments: { where: { deletedAt: null } },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.UPDATE_LEGAL_CASE,
                    oldValues: {
                        caseCode: existing.caseCode,
                        defendant: existing.defendant,
                        disputeStatus: existing.disputeStatus,
                    },
                    newValues: {
                        caseCode: updated.caseCode,
                        defendant: updated.defendant,
                        disputeStatus: updated.disputeStatus,
                    },
                },
            });

            return updated;
        });
    }

    async softDeleteWithAudit(internalId: string, userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.legalCase.findFirst({
                where: { internalId, deletedAt: null },
            });

            if (!existing) {
                throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ (Legal Case not found)');
            }

            const now = new Date();
            await tx.legalCase.update({
                where: { internalId },
                data: {
                    deletedAt: now,
                    updatedById: userId,
                },
            });

            await tx.caseAttachment.updateMany({
                where: { legalCaseId: internalId, deletedAt: null },
                data: { deletedAt: now },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.DELETE_LEGAL_CASE,
                    oldValues: {
                        internalId: existing.internalId,
                        caseCode: existing.caseCode,
                        defendant: existing.defendant,
                    },
                    newValues: { deletedAt: now },
                },
            });
        });
    }

    async getDashboardStats(): Promise<LegalCaseDashboardStats> {
        const [
            totalCases,
            inProgressCases,
            resolvedCases,
            financialSums,
            byStatusRaw,
            byTypeRaw,
            deptsWithCases,
        ] = await Promise.all([
            this.prisma.legalCase.count({ where: { deletedAt: null } }),
            this.prisma.legalCase.count({
                where: {
                    disputeStatus: {
                        in: [
                            DisputeStatus.FIRST_INSTANCE,
                            DisputeStatus.APPEAL,
                            DisputeStatus.SUPREME,
                        ],
                    },
                    deletedAt: null,
                },
            }),
            this.prisma.legalCase.count({
                where: {
                    disputeStatus: {
                        in: [DisputeStatus.CLOSED, DisputeStatus.RESOLVED],
                    },
                    deletedAt: null,
                },
            }),
            this.prisma.legalCase.aggregate({
                _sum: {
                    damageLak: true,
                    damageUsd: true,
                    fineLak: true,
                    fineUsd: true,
                    totalDueLak: true,
                    totalDueUsd: true,
                    recoveredLak: true,
                    recoveredUsd: true,
                },
                where: { deletedAt: null },
            }),
            this.prisma.legalCase.groupBy({
                by: ['disputeStatus'],
                _count: { internalId: true },
                where: { deletedAt: null },
            }),
            this.prisma.legalCase.groupBy({
                by: ['caseType'],
                _count: { internalId: true },
                where: { deletedAt: null },
            }),
            this.prisma.department.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    _count: {
                        select: {
                            legalCases: { where: { deletedAt: null } },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            }),
        ]);

        const statusChart = byStatusRaw.map((item) => ({
            disputeStatus: item.disputeStatus,
            count: item._count.internalId,
        }));

        const typeChart = byTypeRaw.map((item) => ({
            caseType: item.caseType,
            count: item._count.internalId,
        }));

        const departmentChart = deptsWithCases.map((dept) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            count: dept._count.legalCases,
        }));

        return {
            totalCases,
            inProgressCases,
            resolvedCases,
            financialSummary: {
                totalDamageLak: Number(financialSums._sum.damageLak || 0),
                totalDamageUsd: Number(financialSums._sum.damageUsd || 0),
                totalFineLak: Number(financialSums._sum.fineLak || 0),
                totalFineUsd: Number(financialSums._sum.fineUsd || 0),
                totalDueLak: Number(financialSums._sum.totalDueLak || 0),
                totalDueUsd: Number(financialSums._sum.totalDueUsd || 0),
                totalRecoveredLak: Number(financialSums._sum.recoveredLak || 0),
                totalRecoveredUsd: Number(financialSums._sum.recoveredUsd || 0),
            },
            statusChart,
            typeChart,
            departmentChart,
        };
    }

    async checkDepartmentExists(departmentId: string): Promise<boolean> {
        const count = await this.prisma.department.count({
            where: { id: departmentId },
        });
        return count > 0;
    }
}
