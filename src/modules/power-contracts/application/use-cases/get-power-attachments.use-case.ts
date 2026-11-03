import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetPowerAttachmentsUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly contractRepo: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(powerContractId: string, user?: any) {
        if (user && !canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນໄຟລ໌ແນບ');
        }

        const contract = await this.contractRepo.findById(powerContractId);
        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າ');
        }

        const attachments = await this.attachmentRepo.findAttachmentsByContractId(powerContractId);

        return {
            message: 'ດຶງລາຍການໄຟລ໌ແນບສຳເລັດ',
            data: attachments,
        };
    }
}

