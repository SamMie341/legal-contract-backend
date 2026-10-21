import { Contract, ContractType, ContractStatus } from '@prisma/client';
import { CreateContractDto } from '../../application/dto/create-contract.dto.js';
import { UpdateContractDto } from '../../application/dto/update-contract.dto.js';

export const CONTRACT_REPOSITORY = Symbol('CONTRACT_REPOSITORY');

export interface IContractRepository {
    findContractTypeById(id: number): Promise<ContractType | null>;
    findById(id: string): Promise<any | null>;
    createContractWithAudit(
        data: CreateContractDto,
        initialStatus: ContractStatus,
        userId: string,
    ): Promise<Contract>;
    updateContractWithAudit(
        id: string,
        data: UpdateContractDto,
        userId: string,
    ): Promise<Contract>;
    deleteContractWithAudit(id: string, userId: string): Promise<void>;
    findAllWithFilters(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        contractTypeId?: number;
    }): Promise<{ data: any[]; total: number }>;
    findContractsExpiringSoon(days: number): Promise<Contract[]>;
    markContractAsExpiringAndNotify(contractId: string, daysRemaining: number): Promise<void>;
    getDashboardStats(): Promise<{
        total: number;
        byStatus: any[];
        byCurrency: any[];
        byContractType: any[];
        valueByCurrency: any[];
        expiringSoonCount: number;
        expiredCount: number;
    }>;
}
