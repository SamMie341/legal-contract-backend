import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeleteLegalCaseUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.LEGAL_CASES, 'canDelete')) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບບັນທຶກຄະດີ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existing = await this.caseRepo.findById(idOrCode);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ');
        }

        await this.caseRepo.softDeleteWithAudit(existing.internalId, userId);

        return {
            message: 'ລົບຂໍ້ມູນຄະດີສຳເລັດ',
            data: { internalId: existing.internalId, caseCode: existing.caseCode },
        };
    }
}
