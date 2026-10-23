import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import * as docRepoInterface from '../../domain/repositories/legal-document.repository.interface.js';

@Injectable()
export class GetDocumentAttachmentsUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
        @Inject(docRepoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: docRepoInterface.ILegalDocumentRepository,
    ) { }

    async execute(legalDocumentId: string, user: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ແນບ (Permission Denied: canView required)');
        }

        const document = await this.legalDocRepo.findById(legalDocumentId);
        if (!document) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ (Legal Document not found)');
        }

        const attachments = await this.attachmentRepo.findByLegalDocumentId(legalDocumentId);

        return {
            message: 'ດຶງລາຍການໄຟລ໌ແນບສຳເລັດ',
            data: attachments,
        };
    }
}
