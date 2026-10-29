import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DeleteAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isContractDiv = isGeneralContractDivision(user?.division);
        const canDelete =
            user.role === UserRole.ADMIN ||
            (isContractDiv && (user.role === UserRole.MAIN_USER || user.canDelete === true));
        if (!canDelete) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາທົ່ວໄປ)');
        }

        await this.attachmentRepo.deleteAttachment(attachmentId, user.userId);

        return {
            message: 'ລົບໄຟລ໌ແນບສຳເລັດ',
        };
    }
}
