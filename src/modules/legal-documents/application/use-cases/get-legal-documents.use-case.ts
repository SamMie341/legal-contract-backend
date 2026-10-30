import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { QueryLegalDocumentDto } from '../dto/query-legal-document.dto.js';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetLegalDocumentsUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(query: QueryLegalDocumentDto, user: any) {
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isLegalDocumentDivision(user?.division) || user.canView === false)
        ) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນນິຕິກຳ');
        }

        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const { data, total } = await this.legalDocRepo.findAll({
            skip,
            take: limit,
            search: query.search,
            docType: query.docType,
            status: query.status,
            issueYear: query.issueYear,
            departmentId: query.departmentId,
        });

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            message: 'ດຶງລາຍການນິຕິກຳສຳເລັດ',
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
