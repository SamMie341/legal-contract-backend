import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DownloadPowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any, ipAddress?: string, userAgent?: string) {
        // 1. ກວດສອບສິດການດາວໂຫຼດ
        if (!canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canDownload')) {
            throw new ForbiddenException(
                'ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ນີ້',
            );
        }

        // 2. ຄົ້ນຫາໄຟລ໌ໃນລະບົບ
        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການ');
        }

        // 3. ບັນທຶກປະຫວັດການດາວໂຫຼດ
        await this.attachmentRepo.logDownload({
            powerContractId: attachment.powerContractId,
            attachmentId: attachment.id,
            userId: user.userId,
            ipAddress,
            userAgent,
        });

        return attachment;
    }
}

