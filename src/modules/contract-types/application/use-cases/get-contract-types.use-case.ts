import { Injectable, Inject } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';

@Injectable()
export class GetContractTypesUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute(query?: { search?: string; isActive?: string }) {
        const isActive =
            query?.isActive === undefined
                ? undefined
                : query.isActive === 'true';

        const types = await this.contractTypeRepo.findAll({
            search: query?.search,
            isActive,
        });

        return {
            message: 'ດຶງລາຍການປະເພດສັນຍາສຳເລັດ',
            total: types.length,
            data: types,
        };
    }
}
