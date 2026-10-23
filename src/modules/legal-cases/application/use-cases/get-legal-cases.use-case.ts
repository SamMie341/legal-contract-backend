import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { QueryLegalCaseDto } from '../dto/query-legal-case.dto.js';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';

@Injectable()
export class GetLegalCasesUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(query: QueryLegalCaseDto, user: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນຄະດີ (Permission Denied: canView required)');
        }

        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const { data, total } = await this.caseRepo.findAll({
            skip,
            take: limit,
            search: query.search,
            caseType: query.caseType,
            disputeStatus: query.disputeStatus,
            departmentId: query.departmentId,
            startDate: query.startDate,
            endDate: query.endDate,
        });

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            message: 'ດຶງລາຍການຄະດີສຳເລັດ',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}
