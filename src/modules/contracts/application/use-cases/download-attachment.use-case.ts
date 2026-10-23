import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class DownloadAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any, ipAddress?: string, userAgent?: string) {
        // 1. เช็คสิทธิ์การดาวน์โหลด (ตามเอกสาร Requirement ข้อ 5)
        // - Admin โหลดได้เสมอ
        // - ผู้ใช้ที่ได้รับอนุญาต canDownload = true
        const isAdmin = user.role === UserRole.ADMIN;
        const isAuthorizedUser = user.canDownload === true;

        if (!isAdmin && !isAuthorizedUser) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ນີ້ (Permission Denied: canDownload required)');
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
