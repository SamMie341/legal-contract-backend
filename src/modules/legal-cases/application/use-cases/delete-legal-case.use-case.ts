import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';

@Injectable()
export class DeleteLegalCaseUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const canDelete =
                user.role === UserRole.ADMIN ||
                user.role === UserRole.MAIN_USER ||
                user.canDelete === true;
            if (!canDelete) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບບັນທຶກຄະດີ (Permission Denied: canDelete required)');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existing = await this.caseRepo.findById(idOrCode);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ (Legal Case not found)');
        }

        await this.caseRepo.softDeleteWithAudit(existing.internalId, userId);

        return {
            message: 'ລົບຂໍ້ມູນຄະດີສຳເລັດ',
            data: { internalId: existing.internalId, caseCode: existing.caseCode },
        };
    }
}
