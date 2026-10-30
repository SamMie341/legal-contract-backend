import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class PreviewPowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        // 1. ກວດສອບສິດການເບິ່ງ (Admin ຫຼື ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ)
        const isPowerDiv = isPowerContractDivision(user?.division);
        const canView =
            user.role === UserRole.ADMIN ||
            (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canView !== false));

        if (!canView) {
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

