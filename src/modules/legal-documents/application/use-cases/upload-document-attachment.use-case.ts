import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/document-attachment.repository.interface.js';
import * as docRepoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UploadDocumentAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.DOCUMENT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.IDocumentAttachmentRepository,
        @Inject(docRepoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: docRepoInterface.ILegalDocumentRepository,
    ) { }

    async execute(legalDocumentId: string, file: Express.Multer.File, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isLegalDiv = isLegalDocumentDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isLegalDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບນິຕິກຳ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        if (!file) {
            throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌');
        }

        const document = await this.legalDocRepo.findById(legalDocumentId);
        if (!document) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ');
        }

        const attachment = await this.attachmentRepo.createAttachment({
            legalDocumentId,
            fileName: file.originalname,
            fileUrl: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedById: userId,
        });

        return {
            message: 'ອັບໂຫຼດໄຟລ໌ແນບສຳເລັດ',
            data: attachment,
        };
    }
}
