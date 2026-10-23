import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';

@Injectable()
export class DownloadDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const canDownload =
            user && (user.role === UserRole.ADMIN || user.canDownload === true);

        if (!canDownload) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດດາວໂຫຼດໄຟລ໌ແນບ (Permission Denied: canDownload required)');
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ (Attachment not found)');
        }

        return attachment;
    }
}
