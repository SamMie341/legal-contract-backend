import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IContractAttachmentRepository } from '../../domain/repositories/contract-attachment.repository.interface.js';
import { ContractAttachment, ContractDownloadLog } from '@prisma/client';

@Injectable()
export class ContractAttachmentRepository implements IContractAttachmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createAttachment(data: any): Promise<ContractAttachment> {
        return this.prisma.$transaction(async (tx) => {
            const attachment = await tx.contractAttachment.create({ data });

            // บันทึก Audit Log
            await tx.auditLog.create({
                data: {
                    userId: data.uploadedById,
                    contractId: data.contractId,
                    action: 'UPLOAD_ATTACHMENT',
                    newValues: { fileName: data.fileName, fileSize: data.fileSize, attachmentId: attachment.id },
                },
            });

            return attachment;
        });
    }

    async findAttachmentById(id: string): Promise<ContractAttachment | null> {
        return this.prisma.contractAttachment.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async findAttachmentsByContractId(contractId: string): Promise<ContractAttachment[]> {
        return this.prisma.contractAttachment.findMany({
            where: { contractId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const attachment = await tx.contractAttachment.findFirst({
                where: { id: attachmentId, deletedAt: null },
            });

            if (!attachment) {
                throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການລົບ (Attachment not found)');
            }

            await tx.contractAttachment.update({
                where: { id: attachmentId },
                data: { deletedAt: new Date() },
            });

            await tx.auditLog.create({
                data: {
                    userId: userId,
                    contractId: attachment.contractId,
                    action: 'DELETE_ATTACHMENT',
                    oldValues: { id: attachment.id, fileName: attachment.fileName },
                    newValues: { deletedAt: new Date() },
                },
            });
        });
    }

    async logDownload(data: any): Promise<ContractDownloadLog> {
        return this.prisma.$transaction(async (tx) => {
            const log = await tx.contractDownloadLog.create({ data });

            await tx.auditLog.create({
                data: {
                    userId: data.userId,
                    contractId: data.contractId,
                    action: 'DOWNLOAD_ATTACHMENT',
                    newValues: { attachmentId: data.attachmentId },
                    ipAddress: data.ipAddress,
                },
            });

            return log;
        });
    }
}
