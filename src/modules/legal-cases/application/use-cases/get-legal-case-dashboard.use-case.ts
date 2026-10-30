import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { isDisputeResolutionDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetLegalCaseDashboardUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(user: any) {
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isDisputeResolutionDivision(user?.division) || user.canView === false)
        ) {
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
