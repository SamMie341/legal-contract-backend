import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DeleteDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isLegalDiv = isLegalDocumentDivision(user.division);
            const canDelete =
                user.role === UserRole.ADMIN ||
                (isLegalDiv && (user.role === UserRole.MAIN_USER || user.canDelete === true));
            if (!canDelete) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ (ອະນຸຍາດສະເພາະ ພະແນກນິຕິກຳ)');
            }
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ (Attachment not found)');
        }

        await this.attachmentRepo.softDelete(attachmentId);

        return {
            message: 'ລົບໄຟລ໌ແນບສຳເລັດ',
            data: { id: attachmentId },
        };
    }
}
