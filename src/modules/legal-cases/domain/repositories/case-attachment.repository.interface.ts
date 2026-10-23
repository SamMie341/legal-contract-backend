import { CaseAttachment } from '@prisma/client';

export const CASE_ATTACHMENT_REPOSITORY = 'CASE_ATTACHMENT_REPOSITORY';

export interface CreateCaseAttachmentData {
    legalCaseId: string;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    uploadedById?: string;
}

export interface ICaseAttachmentRepository {
    findByLegalCaseId(legalCaseId: string): Promise<CaseAttachment[]>;
    findById(id: string): Promise<any | null>;
    createAttachment(data: CreateCaseAttachmentData): Promise<CaseAttachment>;
    softDelete(id: string): Promise<void>;
}
