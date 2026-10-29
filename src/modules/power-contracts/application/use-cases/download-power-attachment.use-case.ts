import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DownloadPowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any, ipAddress?: string, userAgent?: string) {
        // 1. ກວດສອບສິດການດາວໂຫຼດ (Admin ໂຫຼດໄດ້ສະເໝີ ຫຼື ຜູ້ໃຊ້ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ທີ່ມີສິດ canDownload)
        const isAdmin = user.role === UserRole.ADMIN;
        const isAuthorizedUser =
            isPowerContractDivision(user?.division) &&
            (user.role === UserRole.MAIN_USER || user.canDownload === true);

        if (!isAdmin && !isAuthorizedUser) {
            throw new ForbiddenException(
                'ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ນີ້ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ທີ່ມີສິດ canDownload ຫຼື Admin)',
            );
        }

        // 2. ຄົ້ນຫາໄຟລ໌ໃນລະບົບ
        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການ (File not found)');
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

