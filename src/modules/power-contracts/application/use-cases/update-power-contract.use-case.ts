import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UpdatePowerContractDto } from '../dto/update-power-contract.dto.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class UpdatePowerContractUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, dto: UpdatePowerContractDto, user: any) {
        // 0. ກວດສອບສິດການແກ້ໄຂຂໍ້ມູນສັນຍາ
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canEdit')) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າ',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const updatedContract = await this.powerContractRepository.updateContractWithAudit(id, dto, userId);

        return {
            message: 'ແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: updatedContract,
        };
    }
}

