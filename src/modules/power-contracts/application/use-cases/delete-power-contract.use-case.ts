import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DeletePowerContractUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(id: string, user: any) {
        // 0. ກວດສອບສິດການລົບສັນຍາ (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete ຕາມ Division)
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isPowerDiv = isPowerContractDivision(user.division);
            const canDelete =
                user.role === UserRole.ADMIN ||
                (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canDelete === true));
            if (!canDelete) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດລົບສັນຍາຊື້-ຂາຍໄຟຟ້າ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ຫຼື Admin)',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        await this.powerContractRepository.deleteContractWithAudit(id, userId);

        return {
            message: 'ລົບສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ (Soft Delete)',
        };
    }
}

