import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DownloadDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isLegalDiv = isLegalDocumentDivision(user?.division);
        const canDownload =
            user && (user.role === UserRole.ADMIN || (isLegalDiv && user.canDownload === true));

        if (!canDownload) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ແນບ');
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ');
        }

        return attachment;
    }
}
