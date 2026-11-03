import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DownloadAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any, ipAddress?: string, userAgent?: string) {
        // 1. เช็คสิทธิ์การดาวน์โหลด
        if (!canAccessModule(user, SystemModule.CONTRACTS, 'canDownload')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ນີ້');
        }

        // 2. ค้นหาไฟล์ในระบบ
        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການ (File not found)');
        }

        // 3. บันทึกประวัติการดาวน์โหลด (Audit Log)
        await this.attachmentRepo.logDownload({
            contractId: attachment.contractId,
            attachmentId: attachment.id,
            userId: user.userId,
            ipAddress,
            userAgent,
        });

        // 4. ส่งคืนข้อมูลไฟล์เพื่อนำไปสร้าง Stream ดาวน์โหลดต่อใน Controller
        return attachment;
    }
}
