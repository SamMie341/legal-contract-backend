import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetPowerContractByIdUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, user?: any) {
        if (user && !canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າ');
        }

        const contract = await this.powerContractRepository.findById(id);

        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້ານີ້ໃນລະບົບ');
        }

        return {
            message: 'ດຶງຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: contract,
        };
    }
}

