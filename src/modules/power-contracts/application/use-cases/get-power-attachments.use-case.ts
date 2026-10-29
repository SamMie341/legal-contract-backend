import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';

@Injectable()
export class GetPowerAttachmentsUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly contractRepo: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(powerContractId: string, _user?: any) {
        const contract = await this.contractRepo.findById(powerContractId);
        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contract not found)');
        }

        const attachments = await this.attachmentRepo.findAttachmentsByContractId(powerContractId);

        return {
            message: 'ດຶງລາຍການໄຟລ໌ແນບສຳເລັດ',
            data: attachments,
        };
    }
}

