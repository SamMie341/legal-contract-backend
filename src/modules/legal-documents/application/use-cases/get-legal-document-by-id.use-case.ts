import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class GetLegalDocumentByIdUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(id: string, user: any) {
        if (user && !canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canView')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນນິຕິກຳ');
        }

        const document = await this.legalDocRepo.findById(id);
        if (!document) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ');
        }

        return {
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດນິຕິກຳສຳເລັດ',
            data: document,
        };
    }
}
