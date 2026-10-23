import { CaseType, DisputeStatus, LegalCase } from '@prisma/client';

export const LEGAL_CASE_REPOSITORY = 'LEGAL_CASE_REPOSITORY';

export interface FindAllLegalCasesParams {
    skip?: number;
    take?: number;
    search?: string;
    caseType?: CaseType;
    disputeStatus?: DisputeStatus;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
}

export interface LegalCaseDashboardStats {
    totalCases: number;
    inProgressCases: number;
    resolvedCases: number;
    financialSummary: {
        totalDamageLak: number;
        totalDamageUsd: number;
        totalFineLak: number;
        totalFineUsd: number;
        totalDueLak: number;
        totalDueUsd: number;
        totalRecoveredLak: number;
        totalRecoveredUsd: number;
    };
    statusChart: Array<{ disputeStatus: DisputeStatus; count: number }>;
    typeChart: Array<{ caseType: CaseType; count: number }>;
    departmentChart: Array<{
        id: string;
        name: string;
        code: string | null;
        count: number;
    }>;
}

export interface ILegalCaseRepository {
    findAll(params: FindAllLegalCasesParams): Promise<{ data: any[]; total: number }>;
    findById(idOrCode: string): Promise<any | null>;
    findByCode(caseCode: string, excludeInternalId?: string): Promise<LegalCase | null>;
    createWithAudit(data: any, userId: string): Promise<LegalCase>;
    updateWithAudit(internalId: string, data: any, userId: string): Promise<LegalCase>;
    softDeleteWithAudit(internalId: string, userId: string): Promise<void>;
    getDashboardStats(): Promise<LegalCaseDashboardStats>;
    checkDepartmentExists(departmentId: string): Promise<boolean>;
}
