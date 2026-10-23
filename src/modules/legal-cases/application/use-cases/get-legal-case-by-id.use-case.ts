import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';

@Injectable()
export class GetLegalCaseByIdUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, user: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນຄະດີ (Permission Denied: canView required)');
        }

        const legalCase = await this.caseRepo.findById(idOrCode);
        if (!legalCase) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ (Legal Case not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດຄະດີສຳເລັດ',
            data: legalCase,
        };
    }
}
