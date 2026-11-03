import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { QueryPowerContractDto } from '../dto/query-power-contract.dto.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetPowerContractsUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(query: QueryPowerContractDto, user?: any) {
        if (user && !canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າ');
        }

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

