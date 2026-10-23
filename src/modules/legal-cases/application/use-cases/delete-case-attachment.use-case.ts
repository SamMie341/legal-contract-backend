import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as attachmentRepoInterface from '../../domain/repositories/case-attachment.repository.interface.js';

@Injectable()
export class DeleteCaseAttachmentUseCase {
    constructor(
        @Inject(attachmentRepoInterface.CASE_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: attachmentRepoInterface.ICaseAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const canDelete =
                user.role === UserRole.ADMIN ||
                user.role === UserRole.MAIN_USER ||
                user.canDelete === true;
            if (!canDelete) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ (Permission Denied: canDelete required)');
            }
        }

        const attachment = await this.attachmentRepo.findById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ແນບ (Attachment not found)');
        }

        await this.attachmentRepo.softDelete(attachmentId);

        return {
            message: 'ລົບໄຟລ໌ແນບສຳເລັດ',
            data: { id: attachmentId },
        };
    }
}
