import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class GetContractsUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(query: any, user?: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນສັນຍາ (Permission Denied: canView required)');
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
