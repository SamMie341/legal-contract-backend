import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetLegalCaseDashboardUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(user: any) {
        if (user && !canAccessModule(user, SystemModule.LEGAL_CASES, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນ Dashboard ຄະດີ');
        }

        const stats = await this.caseRepo.getDashboardStats();

        return {
            message: 'ດຶງຂໍ້ມູນ Dashboard ຄະດີສຳເລັດ',
            data: {
                summary: {
                    totalCases: stats.totalCases,
                    inProgressCases: stats.inProgressCases,
                    resolvedCases: stats.resolvedCases,
                },
                financialSummary: stats.financialSummary,
                statusDonutChart: stats.statusChart,
                typeDonutChart: stats.typeChart,
                departmentBarChart: stats.departmentChart,
            },
        };
    }
}
