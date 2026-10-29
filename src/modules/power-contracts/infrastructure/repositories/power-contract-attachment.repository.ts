import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IPowerContractAttachmentRepository } from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { PowerContractAttachment, PowerContractDownloadLog } from '@prisma/client';

@Injectable()
export class PowerContractAttachmentRepository implements IPowerContractAttachmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createAttachment(data: {
        powerContractId: string;
        fileName: string;
        storageKey: string;
        mimeType: string;
        fileSize: number | bigint;
        uploadedById: string;
    }): Promise<PowerContractAttachment> {
        return this.prisma.$transaction(async (tx) => {
            const attachment = await tx.powerContractAttachment.create({
                data: {
                    powerContractId: data.powerContractId,
                    fileName: data.fileName,
                    storageKey: data.storageKey,
                    mimeType: data.mimeType,
                    fileSize: BigInt(data.fileSize),
                    uploadedById: data.uploadedById,
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId: data.uploadedById,
                    powerContractId: data.powerContractId,
                    action: 'UPLOAD_POWER_ATTACHMENT',
                    newValues: {
                        fileName: data.fileName,
                        fileSize: Number(data.fileSize),
                        attachmentId: attachment.id,
                    },
                },
            });

            return attachment;
        });
    }

    async findAttachmentById(id: string): Promise<PowerContractAttachment | null> {
        return this.prisma.powerContractAttachment.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async findAttachmentsByContractId(powerContractId: string): Promise<PowerContractAttachment[]> {
        return this.prisma.powerContractAttachment.findMany({
            where: { powerContractId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: { select: { id: true, fullName: true, employeeCode: true } },
            },
        });
    }

    async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const attachment = await tx.powerContractAttachment.findFirst({
                where: { id: attachmentId, deletedAt: null },
            });

            if (!attachment) {
                throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການລົບ (Attachment not found)');
            }

            await tx.powerContractAttachment.update({
                where: { id: attachmentId },
                data: { deletedAt: new Date() },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    powerContractId: attachment.powerContractId,
                    action: 'DELETE_POWER_ATTACHMENT',
                    oldValues: { id: attachment.id, fileName: attachment.fileName },
                    newValues: { deletedAt: new Date() },
                },
            });
        });
    }

    async logDownload(data: {
        powerContractId: string;
        attachmentId: string;
        userId: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<PowerContractDownloadLog> {
        return this.prisma.$transaction(async (tx) => {
            const log = await tx.powerContractDownloadLog.create({
                data: {
                    powerContractId: data.powerContractId,
                    attachmentId: data.attachmentId,
                    userId: data.userId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: data.userId,
                    powerContractId: data.powerContractId,
                    action: 'DOWNLOAD_POWER_ATTACHMENT',
                    newValues: { attachmentId: data.attachmentId },
                    ipAddress: data.ipAddress,
                },
            });

            return log;
        });
    }
}

