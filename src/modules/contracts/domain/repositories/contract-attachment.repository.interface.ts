import { ContractAttachment, ContractDownloadLog } from '@prisma/client';

export const CONTRACT_ATTACHMENT_REPOSITORY = Symbol('CONTRACT_ATTACHMENT_REPOSITORY');

export interface IContractAttachmentRepository {
    createAttachment(data: {
        contractId: string;
        fileName: string;
        storageKey: string;
        mimeType: string;
        fileSize: number;
        uploadedById: string;
    }): Promise<ContractAttachment>;

    findAttachmentById(id: string): Promise<ContractAttachment | null>;

    findAttachmentsByContractId(contractId: string): Promise<ContractAttachment[]>;

    deleteAttachment(attachmentId: string, userId: string): Promise<void>;

    logDownload(data: {
        contractId: string;
        attachmentId: string;
        userId: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<ContractDownloadLog>;
}
