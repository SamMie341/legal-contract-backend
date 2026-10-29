import { PowerContract, PowerContractType, ContractStatus, AuditAction } from '@prisma/client';
import { CreatePowerContractDto } from '../../application/dto/create-power-contract.dto.js';
import { UpdatePowerContractDto } from '../../application/dto/update-power-contract.dto.js';

export const POWER_CONTRACT_REPOSITORY = Symbol('POWER_CONTRACT_REPOSITORY');

export interface IPowerContractRepository {
    findById(id: string): Promise<any | null>;
    getContractHistory(
        contractId: string,
        params?: {
            skip?: number;
            take?: number;
            action?: AuditAction;
        },
    ): Promise<{ data: any[]; total: number }>;
    createContractWithAudit(
        data: CreatePowerContractDto,
        initialStatus: ContractStatus,
        userId: string,
    ): Promise<PowerContract>;
    updateContractWithAudit(
        id: string,
        data: UpdatePowerContractDto,
        userId: string,
    ): Promise<PowerContract>;
    deleteContractWithAudit(id: string, userId: string): Promise<void>;
    findAllWithFilters(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        contractType?: PowerContractType;
        projectTypeOrCustomer?: string;
    }): Promise<{ data: any[]; total: number }>;
    findContractsExpiringSoon(days: number): Promise<PowerContract[]>;
    markContractAsExpiringAndNotify(contractId: string, daysRemaining: number): Promise<void>;
    findExpiredActiveContracts(): Promise<PowerContract[]>;
    markContractAsExpiredAndNotify(contractId: string): Promise<void>;
    getDashboardStats(): Promise<{
        total: number;
        byStatus: any[];
        byContractType: {
            purchaseCount: number;
            saleCount: number;
            totalCapacityPurchase: number;
            totalCapacitySale: number;
        };
        byProjectType: any[];
        totalInstalledCapacity: number;
        expiringSoonCount: number;
        expiredCount: number;
        expiringSoonList: any[];
    }>;
}

