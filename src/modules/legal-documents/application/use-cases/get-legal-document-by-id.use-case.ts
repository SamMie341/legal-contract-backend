import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetLegalDocumentByIdUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(id: string, user: any) {
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isLegalDocumentDivision(user?.division) || user.canView === false)
        ) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນນິຕິກຳ (ອະນຸຍາດສະເພາະ ພະແນກນິຕິກຳ)');
        }

        const document = await this.legalDocRepo.findById(id);
        if (!document) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ (Legal Document not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນລາຍລະອຽດນິຕິກຳສຳເລັດ',
            data: document,
        };
    }
}
