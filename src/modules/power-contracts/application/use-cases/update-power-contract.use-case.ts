import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UpdatePowerContractDto } from '../dto/update-power-contract.dto.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UpdatePowerContractUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, dto: UpdatePowerContractDto, user: any) {
        // 0. ກວດສອບສິດການແກ້ໄຂຂໍ້ມູນສັນຍາ (Admin, Main User ຫຼື ຜູ້ມີສິດ canEdit ຕາມ Division)
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isPowerDiv = isPowerContractDivision(user.division);
            const canEdit =
                user.role === UserRole.ADMIN ||
                (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canEdit === true));
            if (!canEdit) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ຫຼື Admin)',
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

