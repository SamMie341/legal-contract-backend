import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as attachmentRepoInterface from '../../domain/repositories/case-attachment.repository.interface.js';
import * as caseRepoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetCaseAttachmentsUseCase {
    constructor(
        @Inject(attachmentRepoInterface.CASE_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.ICaseAttachmentRepository,
        @Inject(caseRepoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: caseRepoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, user: any) {
        if (user && !canAccessModule(user, SystemModule.LEGAL_CASES, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງໄຟລ໌ແນບ');
        }

        const legalCase = await this.caseRepo.findById(idOrCode);
        if (!legalCase) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ');
        }

        const attachments = await this.attachmentRepo.findByLegalCaseId(legalCase.internalId);

        return {
            message: 'ດຶງລາຍການໄຟລ໌ແນບສຳເລັດ',
            data: attachments,
        };
    }
}
