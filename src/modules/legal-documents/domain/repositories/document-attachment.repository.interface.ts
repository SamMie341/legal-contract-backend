import { DocumentAttachment } from '@prisma/client';

export const DOCUMENT_ATTACHMENT_REPOSITORY = 'DOCUMENT_ATTACHMENT_REPOSITORY';

export interface CreateDocumentAttachmentData {
    legalDocumentId: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    uploadedById?: string;
}

export interface IDocumentAttachmentRepository {
    findByLegalDocumentId(legalDocumentId: string): Promise<DocumentAttachment[]>;
    findById(id: string): Promise<any | null>;
    createAttachment(data: CreateDocumentAttachmentData): Promise<DocumentAttachment>;
    softDelete(id: string): Promise<void>;
}
