import { DocumentStatus, DocumentType, LegalDocument } from '@prisma/client';

export const LEGAL_DOCUMENT_REPOSITORY = 'LEGAL_DOCUMENT_REPOSITORY';

export interface FindAllLegalDocumentsParams {
    skip?: number;
    take?: number;
    search?: string;
    docType?: DocumentType;
    status?: DocumentStatus;
    issueYear?: number;
    departmentId?: string;
}

export interface LegalDocumentDashboardStats {
    totalDocs: number;
    activeDocs: number;
    inactiveDocs: number;
    totalDepartmentsWithDocs: number;
    byType: Array<{ docType: DocumentType; count: number }>;
    byDepartment: Array<{
        id: string;
        name: string;
        code: string | null;
        count: number;
    }>;
}

export interface ILegalDocumentRepository {
    findAll(params: FindAllLegalDocumentsParams): Promise<{ data: any[]; total: number }>;
    findById(id: string): Promise<any | null>;
    createWithAudit(data: any, userId: string): Promise<LegalDocument>;
    updateWithAudit(id: string, data: any, userId: string): Promise<LegalDocument>;
    softDeleteWithAudit(id: string, userId: string): Promise<void>;
    getDashboardStats(): Promise<LegalDocumentDashboardStats>;
    checkDepartmentExists(departmentId: string): Promise<boolean>;
}
