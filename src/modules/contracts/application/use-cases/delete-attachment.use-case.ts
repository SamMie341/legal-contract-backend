import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeleteAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        if (!canAccessModule(user, SystemModule.CONTRACTS, 'canDelete')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ');
        }

        await this.attachmentRepo.deleteAttachment(attachmentId, user.userId);

        return {
            message: 'ລົບໄຟລ໌ແນບສຳເລັດ',
        };
    }
}
