import { Injectable, Inject } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';

@Injectable()
export class GetPowerDashboardStatsUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(_user?: any) {
        const stats = await this.powerContractRepository.getDashboardStats();

        return {
            message: 'ດຶງຂໍ້ມູນສະຖິຕິ Dashboard ສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: stats,
        };
    }
}

