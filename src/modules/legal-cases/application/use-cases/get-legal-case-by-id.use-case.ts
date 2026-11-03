import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetLegalCaseByIdUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, user: any) {
        if (user && !canAccessModule(user, SystemModule.LEGAL_CASES, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນຄະດີ');
        }

        const legalCase = await this.caseRepo.findById(idOrCode);
        if (!legalCase) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ');
        }

        return {
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດຄະດີສຳເລັດ',
            data: legalCase,
        };
    }
}
