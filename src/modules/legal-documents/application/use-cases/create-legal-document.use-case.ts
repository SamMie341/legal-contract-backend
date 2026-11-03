import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateLegalDocumentDto } from '../dto/create-legal-document.dto.js';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class CreateLegalDocumentUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(dto: CreateLegalDocumentDto, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canUpload')) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດສ້າງນິຕິກຳ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const departmentExists = await this.legalDocRepo.checkDepartmentExists(dto.departmentId);
        if (!departmentExists) {
            throw new BadRequestException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ລະບຸ');
        }

        const newDoc = await this.legalDocRepo.createWithAudit(dto, userId);

        return {
            message: 'ສ້າງນິຕິກຳໃໝ່ສຳເລັດ',
            data: newDoc,
        };
    }
}
