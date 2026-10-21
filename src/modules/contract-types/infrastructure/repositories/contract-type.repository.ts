import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IContractTypeRepository } from '../../domain/repositories/contract-type.repository.interface.js';
import { CreateContractTypeDto } from '../../application/dto/create-contract-type.dto.js';
import { UpdateContractTypeDto } from '../../application/dto/update-contract-type.dto.js';
import { ContractType } from '@prisma/client';

@Injectable()
export class ContractTypeRepository implements IContractTypeRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: { search?: string; isActive?: boolean }): Promise<any[]> {
        const whereCondition: any = {};

        if (params.search) {
            whereCondition.OR = [
                { nameLo: { contains: params.search, mode: 'insensitive' } },
                { nameEn: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params.isActive !== undefined) {
            whereCondition.isActive = params.isActive;
        }

        return this.prisma.contractType.findMany({
            where: whereCondition,
            orderBy: { id: 'asc' },
            include: {
                _count: {
                    select: {
                        contracts: { where: { deletedAt: null } },
                    },
                },
            },
        });
    }

    async findAllForDropdown(): Promise<ContractType[]> {
        return this.prisma.contractType.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' },
        });
    }

    async findById(id: number): Promise<any | null> {
        return this.prisma.contractType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        contracts: { where: { deletedAt: null } },
                    },
                },
            },
        });
    }

    async findByNameLo(nameLo: string, excludeId?: number): Promise<ContractType | null> {
        return this.prisma.contractType.findFirst({
            where: {
                nameLo,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });
    }

    async create(dto: CreateContractTypeDto): Promise<ContractType> {
        return this.prisma.contractType.create({
            data: {
                nameLo: dto.nameLo,
                nameEn: dto.nameEn,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }

    async update(id: number, dto: UpdateContractTypeDto): Promise<ContractType> {
        return this.prisma.contractType.update({
            where: { id },
            data: dto,
        });
    }

    async countContractsByTypeId(id: number): Promise<number> {
        return this.prisma.contract.count({
            where: { contractTypeId: id },
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.contractType.delete({
            where: { id },
        });
    }
}
