import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as repoInterface from '../../domain/repositories/legal-document.repository.interface.js';
import { isLegalDocumentDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DeleteLegalDocumentUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_DOCUMENT_REPOSITORY)
        private readonly legalDocRepo: repoInterface.ILegalDocumentRepository,
    ) { }

    async execute(id: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isLegalDiv = isLegalDocumentDivision(user.division);
            const canDelete =
                user.role === UserRole.ADMIN ||
                (isLegalDiv && (user.role === UserRole.MAIN_USER || user.canDelete === true));
            if (!canDelete) {
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
