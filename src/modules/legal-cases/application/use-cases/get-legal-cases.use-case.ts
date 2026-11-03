import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { QueryLegalCaseDto } from '../dto/query-legal-case.dto.js';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetLegalCasesUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(query: QueryLegalCaseDto, user: any) {
        if (user && !canAccessModule(user, SystemModule.LEGAL_CASES, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນຄະດີ');
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
