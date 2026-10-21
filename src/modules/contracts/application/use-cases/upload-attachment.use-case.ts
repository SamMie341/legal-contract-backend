import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { CONTRACT_REPOSITORY, type IContractRepository } from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class UploadAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
        @Inject(CONTRACT_REPOSITORY)
        private readonly contractRepo: IContractRepository,
    ) { }

    async execute(contractId: string, file: Express.Multer.File, userId: string) {
        if (!file) throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌ (No file provided)');

        // 1. เช็คว่าสัญญาที่ระบุมีอยู่จริงไหม
        const contract = await this.contractRepo.findById(contractId);
        if (!contract) throw new NotFoundException('ບໍ່ພົບສັນຍາ (Contract not found)');

        // 2. บันทึกข้อมูลไฟล์ลง DB
        const attachment = await this.attachmentRepo.createAttachment({
            contractId,
            fileName: file.originalname,
            storageKey: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: userId,
        });

        return { message: 'ອັບໂຫຼດໄຟລ໌ສຳເລັດ', data: attachment };
    }
}
