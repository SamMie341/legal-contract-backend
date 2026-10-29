import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';

@Injectable()
export class GetPowerContractByIdUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, _user?: any) {
        const contract = await this.powerContractRepository.findById(id);

        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້ານີ້ໃນລະບົບ (Power Contract not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: contract,
        };
    }
}

