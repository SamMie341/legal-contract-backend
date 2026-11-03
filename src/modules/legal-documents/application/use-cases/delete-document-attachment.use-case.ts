import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeleteDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canDelete')) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ');
            }
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ');
        }

        await this.attachmentRepo.softDelete(attachmentId);

        return {
            message: 'ລົບໄຟລ໌ແນບສຳເລັດ',
            data: { id: attachmentId },
        };
    }
}
