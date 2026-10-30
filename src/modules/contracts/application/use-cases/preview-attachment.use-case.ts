import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class PreviewAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        // 1. ตรวจสอบสิทธิ์การดูข้อมูล (canView ตาม Division)
        const isContractDiv = isGeneralContractDivision(user?.division);
        const canView =
            user.role === UserRole.ADMIN ||
            (isContractDiv && (user.role === UserRole.MAIN_USER || user.canView !== false));

        if (!canView) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ນີ້');
        }

        // 2. ค้นหาไฟล์ในระบบ
        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການ (File not found)');
        }

        return attachment;
    }
}
