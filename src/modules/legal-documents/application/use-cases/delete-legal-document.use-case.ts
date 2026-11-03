import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeleteLegalDocumentUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(id: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.LEGAL_DOCUMENTS, 'canDelete')) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບບັນທຶກນິຕິກຳ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existing = await this.legalDocRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນນິຕິກຳ');
        }

        await this.legalDocRepo.softDeleteWithAudit(id, userId);

        return {
            message: 'ລົບຂໍ້ມູນນິຕິກຳສຳເລັດ',
            data: { id },
        };
    }
}
