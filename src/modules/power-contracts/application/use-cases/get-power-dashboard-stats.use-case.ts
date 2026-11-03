import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetPowerDashboardStatsUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(user?: any) {
        if (user && !canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນ Dashboard ສັນຍາຊື້-ຂາຍໄຟຟ້າ');
        }

        const stats = await this.powerContractRepository.getDashboardStats();

        return {
            message: 'ດຶງຂໍ້ມູນສະຖິຕິ Dashboard ສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: stats,
        };
    }
}

