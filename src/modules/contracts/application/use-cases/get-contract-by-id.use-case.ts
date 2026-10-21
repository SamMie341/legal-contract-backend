import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class GetContractByIdUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string) {
        const contract = await this.contractRepository.findById(id);

        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາທີ່ຕ້ອງການ (Contract not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນສັນຍາສຳເລັດ',
            data: contract,
        };
    }
}
