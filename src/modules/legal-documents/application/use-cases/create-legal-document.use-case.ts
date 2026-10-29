import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateLegalDocumentDto } from '../dto/create-legal-document.dto.js';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class CreateLegalDocumentUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(dto: CreateLegalDocumentDto, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isLegalDiv = isLegalDocumentDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isLegalDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດສ້າງນິຕິກຳ (ອະນຸຍາດສະເພາະ ພະແນກນິຕິກຳ)');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const departmentExists = await this.legalDocRepo.checkDepartmentExists(dto.departmentId);
        if (!departmentExists) {
            throw new BadRequestException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ລະບຸ (Department not found)');
        }

        const newDoc = await this.legalDocRepo.createWithAudit(dto, userId);

        return {
            message: 'ສ້າງນິຕິກຳໃໝ່ສຳເລັດ',
            data: newDoc,
        };
    }
}
