import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class PreviewDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        if (!canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ແນບ');
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ');
        }

        return attachment;
    }
}
