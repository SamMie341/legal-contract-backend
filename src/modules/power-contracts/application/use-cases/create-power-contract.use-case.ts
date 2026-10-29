import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { CreatePowerContractDto } from '../dto/create-power-contract.dto.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { ContractStatus, UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class CreatePowerContractUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(dto: CreatePowerContractDto, user: any) {
        // 0. ກວດສອບສິດການສ້າງ/ອັບໂຫຼດສັນຍາ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload ຕາມ Division)
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isPowerDiv = isPowerContractDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດສ້າງ ຫຼື ອັບໂຫຼດສັນຍາຊື້-ຂາຍໄຟຟ້າ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ຫຼື Admin)',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        // 1. Business Logic: ຄຳນວນສະຖານະເລີ່ມຕົ້ນ
        let initialStatus: ContractStatus = ContractStatus.ACTIVE;
        const now = new Date();

        if (dto.effectiveDate && new Date(dto.effectiveDate) > now) {
            initialStatus = ContractStatus.DRAFT;
        } else if (dto.expirationDate) {
            const expireDate = new Date(dto.expirationDate);
            const daysToExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysToExpiry <= 0) {
                initialStatus = ContractStatus.EXPIRED;
            } else if (daysToExpiry <= (dto.notifyDaysBefore || 60)) {
                initialStatus = ContractStatus.EXPIRING_SOON;
            }
        }

        // 2. ບັນທຶກຂໍ້ມູນພ້ອມສ້າງ Audit Log
        const newContract = await this.powerContractRepository.createContractWithAudit(dto, initialStatus, userId);

        return {
            message: 'ບັນທຶກຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data: newContract,
        };
    }
}

