import { Injectable, Inject } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { QueryPowerContractDto } from '../dto/query-power-contract.dto.js';

@Injectable()
export class GetPowerContractsUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(query: QueryPowerContractDto, _user?: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const { data, total } = await this.powerContractRepository.findAllWithFilters({
            skip,
            take: limit,
            search: query.search,
            status: query.status,
            contractType: query.contractType,
            projectTypeOrCustomer: query.projectTypeOrCustomer,
        });

        return {
            message: 'ດຶງລາຍການສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

