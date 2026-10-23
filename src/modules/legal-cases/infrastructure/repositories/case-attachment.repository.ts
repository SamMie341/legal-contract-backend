import { Injectable } from '@nestjs/common';
import { CaseAttachment } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import {
    CreateCaseAttachmentData,
    ICaseAttachmentRepository,
} from '../../domain/repositories/case-attachment.repository.interface.js';

@Injectable()
export class CaseAttachmentRepository implements ICaseAttachmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByLegalCaseId(legalCaseId: string): Promise<CaseAttachment[]> {
        return this.prisma.caseAttachment.findMany({
            where: {
                legalCaseId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.caseAttachment.findFirst({
            where: { id, deletedAt: null },
            include: {
                legalCase: true,
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async createAttachment(data: CreateCaseAttachmentData): Promise<CaseAttachment> {
        return this.prisma.caseAttachment.create({
            data: {
                legalCaseId: data.legalCaseId,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                fileSize: data.fileSize,
                uploadedById: data.uploadedById,
            },
            include: {
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async softDelete(id: string): Promise<void> {
        await this.prisma.caseAttachment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
