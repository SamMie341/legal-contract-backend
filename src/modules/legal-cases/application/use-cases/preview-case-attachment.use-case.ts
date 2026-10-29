import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/case-attachment.repository.interface.js';
import { isDisputeResolutionDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class PreviewCaseAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.CASE_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.ICaseAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isDisputeResolutionDivision(user?.division) || user.canView === false)
        ) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ແນບ (ອະນຸຍາດສະເພາະ ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ)');
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ (Attachment not found)');
        }

        return attachment;
    }
}
