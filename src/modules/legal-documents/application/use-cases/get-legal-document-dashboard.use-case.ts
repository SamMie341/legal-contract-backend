import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';

@Injectable()
export class GetLegalDocumentDashboardUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(user: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນ Dashboard ນິຕິກຳ (Permission Denied: canView required)');
        }

        const stats = await this.legalDocRepo.getDashboardStats();

        return {
            message: 'ດຶງຂໍ້ມູນ Dashboard ນິຕິກຳສຳເລັດ',
            data: {
                summary: {
                    totalDocuments: stats.totalDocs,
                    activeDocuments: stats.activeDocs,
                    inactiveDocuments: stats.inactiveDocs,
                    totalDepartmentsWithDocuments: stats.totalDepartmentsWithDocs,
                },
                donutChart: stats.byType,
                departmentBarChart: stats.byDepartment,
            },
        };
    }
}
