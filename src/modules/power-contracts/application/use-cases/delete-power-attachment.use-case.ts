import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import { UserRole } from '@prisma/client';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class DeletePowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
    ) { }

    async execute(attachmentId: string, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isPowerDiv = isPowerContractDivision(user.division);
            const canDelete =
                user.role === UserRole.ADMIN ||
                (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canDelete === true));
            if (!canDelete) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດລົບໄຟລ໌ແນບ',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const attachment = await this.attachmentRepo.findAttachmentById(attachmentId);
        if (!attachment) {
            throw new NotFoundException('ບໍ່ພົບໄຟລ໌ທີ່ຕ້ອງການລົບ');
        }

        await this.attachmentRepo.deleteAttachment(attachmentId, userId);

        return { message: 'ລົບໄຟລ໌ແນບສຳເລັດ' };
    }
}

