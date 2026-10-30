import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdateLegalDocumentDto } from '../dto/update-legal-document.dto.js';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UpdateLegalDocumentUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(id: string, dto: UpdateLegalDocumentDto, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isLegalDiv = isLegalDocumentDivision(user.division);
            const canEdit =
                user.role === UserRole.ADMIN ||
                (isLegalDiv && (user.role === UserRole.MAIN_USER || user.canEdit === true));
            if (!canEdit) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂນິຕິກຳ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existing = await this.legalDocRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ');
        }

        if (dto.departmentId) {
            const departmentExists = await this.legalDocRepo.checkDepartmentExists(dto.departmentId);
            if (!departmentExists) {
                throw new BadRequestException('ບໍ່ພົບຝ່າຍທີ່ລະບຸ');
            }
        }

        const updated = await this.legalDocRepo.updateWithAudit(id, dto, userId);

        return {
            message: 'ແກ້ໄຂຂໍ້ມູນນິຕິກຳສຳເລັດ',
            data: updated,
        };
    }
}
