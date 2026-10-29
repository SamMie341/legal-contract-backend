import { PowerContractAttachment, PowerContractDownloadLog } from '@prisma/client';

export const POWER_CONTRACT_ATTACHMENT_REPOSITORY = Symbol('POWER_CONTRACT_ATTACHMENT_REPOSITORY');

export interface IPowerContractAttachmentRepository {
    createAttachment(data: {
        powerContractId: string;
        fileName: string;
        storageKey: string;
        mimeType: string;
        fileSize: number | bigint;
        uploadedById: string;
    }): Promise<PowerContractAttachment>;

    findAttachmentById(id: string): Promise<PowerContractAttachment | null>;

    findAttachmentsByContractId(powerContractId: string): Promise<PowerContractAttachment[]>;

    deleteAttachment(attachmentId: string, userId: string): Promise<void>;

    logDownload(data: {
        powerContractId: string;
        attachmentId: string;
        userId: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<PowerContractDownloadLog>;
}

