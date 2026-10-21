import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';

@Injectable()
export class GetContractTypeByIdUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute(id: number) {
        const contractType = await this.contractTypeRepo.findById(id);

        if (!contractType) {
            throw new NotFoundException('ບໍ່ພົບປະເພດສັນຍາທີ່ຕ້ອງການ (Contract Type not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນປະເພດສັນຍາສຳເລັດ',
            data: contractType,
        };
    }
}
