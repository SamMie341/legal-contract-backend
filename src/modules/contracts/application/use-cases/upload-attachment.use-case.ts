import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as contractAttachmentRepositoryInterface from '../../domain/repositories/contract-attachment.repository.interface.js';
import { CONTRACT_REPOSITORY, type IContractRepository } from '../../domain/repositories/contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { decodeOriginalFilename } from '../../../../core/utils/file-upload.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

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
            if (!canAccessModule(user, SystemModule.CONTRACTS, 'canUpload')) {
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
            fileName: decodeOriginalFilename(file.originalname),
            storageKey: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: userId,
        });

        return { message: 'ອັບໂຫຼດໄຟລ໌ສຳເລັດ', data: attachment };
    }
}
