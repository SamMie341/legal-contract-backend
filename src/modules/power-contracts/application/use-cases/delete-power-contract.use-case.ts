import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeletePowerContractUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, user: any) {
        // 0. ກວດສອບສິດການລົບສັນຍາ
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canDelete')) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດລົບສັນຍາຊື້-ຂາຍໄຟຟ້າ',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        await this.powerContractRepository.deleteContractWithAudit(id, userId);

        return {
            message: 'ລົບສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
        };
    }
}

