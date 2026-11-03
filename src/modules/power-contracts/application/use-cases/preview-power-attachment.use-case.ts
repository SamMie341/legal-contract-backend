import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class PreviewPowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        // 1. ກວດສອບສິດການເບິ່ງ
        if (!canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canView')) {
            throw new ForbiddenException(
                'ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ນີ້',
            );
        }

        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການ');
        }

        return attachment;
    }
}

