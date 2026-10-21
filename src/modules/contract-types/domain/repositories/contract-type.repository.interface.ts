import { ContractType } from '@prisma/client';
import { CreateContractTypeDto } from '../../application/dto/create-contract-type.dto.js';
import { UpdateContractTypeDto } from '../../application/dto/update-contract-type.dto.js';

export const CONTRACT_TYPE_REPOSITORY = Symbol('CONTRACT_TYPE_REPOSITORY');

export interface IContractTypeRepository {
    findAll(params: {
        search?: string;
        isActive?: boolean;
    }): Promise<any[]>;
    findAllForDropdown(): Promise<ContractType[]>;
    findById(id: number): Promise<any | null>;
    findByNameLo(nameLo: string, excludeId?: number): Promise<ContractType | null>;
    create(dto: CreateContractTypeDto): Promise<ContractType>;
    update(id: number, dto: UpdateContractTypeDto): Promise<ContractType>;
    countContractsByTypeId(id: number): Promise<number>;
    delete(id: number): Promise<void>;
}
