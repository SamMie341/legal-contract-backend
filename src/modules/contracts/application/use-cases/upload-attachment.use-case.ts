import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { CONTRACT_REPOSITORY, type IContractRepository } from '../../domain/repositories/contract.repository.interface.js';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UploadAttachmentUseCase {
    constructor(
        @Inject(contractAttachmentRepositoryInterface.CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: contractAttachmentRepositoryInterface.IContractAttachmentRepository,
        @Inject(CONTRACT_REPOSITORY)
        private readonly contractRepo: IContractRepository,
    ) { }

    async execute(contractId: string, file: Express.Multer.File, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isContractDiv = isGeneralContractDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isContractDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບສັນຍາ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        if (!file) throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌');

        // 1. เช็คว่าสัญญาที่ระบุมีอยู่จริงไหม
        const contract = await this.contractRepo.findById(contractId);
        if (!contract) throw new NotFoundException('ບໍ່ພົບສັນຍາ');

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
