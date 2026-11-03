import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetContractsUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(query: any, user?: any) {
        if (user && !canAccessModule(user, SystemModule.CONTRACTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນສັນຍາ');
        }

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const result = await this.contractRepository.findAllWithFilters({
            skip,
            take: limit,
            search: query.search,
            status: query.status,
            contractTypeId: query.contractTypeId,
        });

        return {
            message: 'ດຶງຂໍ້ມູນສຳເລັດ',
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
            data: result.data,
        };
    }
}
