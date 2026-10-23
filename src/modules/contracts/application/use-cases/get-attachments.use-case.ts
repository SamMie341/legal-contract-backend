import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { CONTRACT_REPOSITORY, type IContractRepository } from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class GetAttachmentsUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
        @Inject(CONTRACT_REPOSITORY)
        private readonly contractRepo: IContractRepository,
    ) { }

    async execute(contractId: string, user?: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນໄຟລ໌ແນບ (Permission Denied: canView required)');
        }

        const contract = await this.contractRepo.findById(contractId);
        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາ (Contract not found)');
        }

        const attachments = await this.attachmentRepo.findAttachmentsByContractId(contractId);

        return {
            message: 'ດຶງລາຍການໄຟລ໌ແນບສຳເລັດ',
            total: attachments.length,
            data: attachments,
        };
    }
}
