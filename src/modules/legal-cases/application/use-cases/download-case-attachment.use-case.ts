import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as attachmentRepoInterface from '../../domain/repositories/case-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DownloadCaseAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.CASE_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.ICaseAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        if (!canAccessModule(user, SystemModule.LEGAL_CASES, 'canDownload')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ແນບ');
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ (Attachment not found)');
        }

        return attachment;
    }
}
