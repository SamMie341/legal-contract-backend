import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { decodeOriginalFilename } from '../../../../core/utils/file-upload.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class UploadPowerAttachmentUseCase {
    constructor(
        @Inject(powerContractAttachmentRepositoryInterface.POWER_CONTRACT_ATTACHMENT_REPOSITORY)
        private readonly attachmentRepo: powerContractAttachmentRepositoryInterface.IPowerContractAttachmentRepository,
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepo: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(powerContractId: string, file: Express.Multer.File, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            if (!canAccessModule(user, SystemModule.POWER_CONTRACTS, 'canUpload')) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບສັນຍາຊື້-ຂາຍໄຟຟ້າ',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        if (!file) throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌');

        // 1. ກວດສອບວ່າສັນຍາມີຈິງ ຫຼື ບໍ່
        const contract = await this.powerContractRepo.findById(powerContractId);
        if (!contract) throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າ');

        // 2. ບັນທຶກຂໍ້ມູນໄຟລ໌ລົງຖານຂໍ້ມູນ
        const attachment = await this.attachmentRepo.createAttachment({
            powerContractId,
            fileName: decodeOriginalFilename(file.originalname),
            storageKey: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: userId,
        });

        return { message: 'ອັບໂຫຼດໄຟລ໌ແນບສຳເລັດ', data: attachment };
    }
}

