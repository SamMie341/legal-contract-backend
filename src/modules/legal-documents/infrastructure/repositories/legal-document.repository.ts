import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, DocumentStatus, LegalDocument } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import {
    FindAllLegalDocumentsParams,
    ILegalDocumentRepository,
    LegalDocumentDashboardStats,
} from '../../domain/repositories/legal-document.repository.interface.js';

@Injectable()
export class LegalDocumentRepository implements ILegalDocumentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: FindAllLegalDocumentsParams): Promise<{ data: any[]; total: number }> {
        const { skip = 0, take = 10, search, docType, status, issueYear, departmentId } = params;

        const whereCondition: any = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                { docTitle: { contains: search, mode: 'insensitive' } },
                { docNumberDate: { contains: search, mode: 'insensitive' } },
                { responsiblePerson: { contains: search, mode: 'insensitive' } },
                { purpose: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (docType) {
            whereCondition.docType = docType;
        }

        if (status) {
            whereCondition.status = status;
        }

        if (issueYear !== undefined && !isNaN(issueYear)) {
            whereCondition.issueYear = issueYear;
        }

        if (departmentId) {
            whereCondition.departmentId = departmentId;
        }

        const [total, data] = await Promise.all([
            this.prisma.legalDocument.count({ where: whereCondition }),
            this.prisma.legalDocument.findMany({
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

    async findById(id: string): Promise<any | null> {
        return this.prisma.legalDocument.findFirst({
            where: { id, deletedAt: null },
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

    async createWithAudit(data: any, userId: string): Promise<LegalDocument> {
        return this.prisma.$transaction(async (tx) => {
            const created = await tx.legalDocument.create({
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
                    action: AuditAction.CREATE_LEGAL_DOCUMENT,
                    newValues: {
                        id: created.id,
                        docTitle: created.docTitle,
                        docNumberDate: created.docNumberDate,
                        docType: created.docType,
                        departmentId: created.departmentId,
                    },
                },
            });

            return created;
        });
    }

    async updateWithAudit(id: string, data: any, userId: string): Promise<LegalDocument> {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.legalDocument.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ (Legal Document not found)');
            }

            const updated = await tx.legalDocument.update({
                where: { id },
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
                    action: AuditAction.UPDATE_LEGAL_DOCUMENT,
                    oldValues: {
                        docTitle: existing.docTitle,
                        docNumberDate: existing.docNumberDate,
                        status: existing.status,
                        docType: existing.docType,
                    },
                    newValues: {
                        docTitle: updated.docTitle,
                        docNumberDate: updated.docNumberDate,
                        status: updated.status,
                        docType: updated.docType,
                    },
                },
            });

            return updated;
        });
    }

    async softDeleteWithAudit(id: string, userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.legalDocument.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ (Legal Document not found)');
            }

            const now = new Date();
            await tx.legalDocument.update({
                where: { id },
                data: {
                    deletedAt: now,
                    updatedById: userId,
                },
            });

            await tx.documentAttachment.updateMany({
                where: { legalDocumentId: id, deletedAt: null },
                data: { deletedAt: now },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    action: AuditAction.DELETE_LEGAL_DOCUMENT,
                    oldValues: {
                        id: existing.id,
                        docTitle: existing.docTitle,
                        docNumberDate: existing.docNumberDate,
                    },
                    newValues: { deletedAt: now },
                },
            });
        });
    }

    async getDashboardStats(): Promise<LegalDocumentDashboardStats> {
        const [totalDocs, activeDocs, inactiveDocs, totalDepartmentsWithDocs, byTypeRaw, deptsWithDocs] =
            await Promise.all([
                this.prisma.legalDocument.count({ where: { deletedAt: null } }),
                this.prisma.legalDocument.count({
                    where: { status: DocumentStatus.ACTIVE, deletedAt: null },
                }),
                this.prisma.legalDocument.count({
                    where: { status: DocumentStatus.INACTIVE, deletedAt: null },
                }),
                this.prisma.department.count({
                    where: { legalDocuments: { some: { deletedAt: null } } },
                }),
                this.prisma.legalDocument.groupBy({
                    by: ['docType'],
                    _count: { id: true },
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
                                legalDocuments: { where: { deletedAt: null } },
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                }),
            ]);

        const byType = byTypeRaw.map((item) => ({
            docType: item.docType,
            count: item._count.id,
        }));

        const byDepartment = deptsWithDocs.map((dept) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            count: dept._count.legalDocuments,
        }));

        return {
            totalDocs,
            activeDocs,
            inactiveDocs,
            totalDepartmentsWithDocs,
            byType,
            byDepartment,
        };
    }

    async checkDepartmentExists(departmentId: string): Promise<boolean> {
        const count = await this.prisma.department.count({
            where: { id: departmentId },
        });
        return count > 0;
    }
}
