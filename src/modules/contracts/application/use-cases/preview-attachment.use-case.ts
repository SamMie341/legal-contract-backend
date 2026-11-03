import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class PreviewAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        // 1. ตรวจสอบสิทธิ์การดูข้อมูล (canView ตาม Module RBAC)
        if (!canAccessModule(user, SystemModule.CONTRACTS, 'canView')) {
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
