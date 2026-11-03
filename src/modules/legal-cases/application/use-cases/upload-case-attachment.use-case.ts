import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as attachmentRepoInterface from '../../domain/repositories/case-attachment.repository.interface.js';
import * as caseRepoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class UploadCaseAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.CASE_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.ICaseAttachmentRepository,
        @Inject(caseRepoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: caseRepoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, file: Express.Multer.File, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.LEGAL_CASES, 'canUpload')) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບຄະດີ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        if (!file) {
            throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌');
        }

        const legalCase = await this.caseRepo.findById(idOrCode);
        if (!legalCase) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ');
        }

        const attachment = await this.attachmentRepo.createAttachment({
            legalCaseId: legalCase.internalId,
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
