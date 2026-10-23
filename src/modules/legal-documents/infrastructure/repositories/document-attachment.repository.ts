import { Injectable } from '@nestjs/common';
import { DocumentAttachment } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import {
    CreateDocumentAttachmentData,
    IDocumentAttachmentRepository,
} from '../../domain/repositories/document-attachment.repository.interface.js';

@Injectable()
export class DocumentAttachmentRepository implements IDocumentAttachmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByLegalDocumentId(legalDocumentId: string): Promise<DocumentAttachment[]> {
        return this.prisma.documentAttachment.findMany({
            where: {
                legalDocumentId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.documentAttachment.findFirst({
            where: { id, deletedAt: null },
            include: {
                legalDocument: true,
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async createAttachment(data: CreateDocumentAttachmentData): Promise<DocumentAttachment> {
        return this.prisma.documentAttachment.create({
            data: {
                legalDocumentId: data.legalDocumentId,
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
        await this.prisma.documentAttachment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
