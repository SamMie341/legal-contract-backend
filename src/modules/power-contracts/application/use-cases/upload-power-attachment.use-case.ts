import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as powerContractAttachmentRepositoryInterface from '../../domain/repositories/power-contract-attachment.repository.interface.js';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { isPowerContractDivision } from '../../../../core/utils/division-helper.util.js';

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
            const isPowerDiv = isPowerContractDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isPowerDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບສັນຍາຊື້-ຂາຍໄຟຟ້າ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ ຫຼື Admin)',
                );
            }
        }
        const userId = isObjectUser ? user.userId : user;

        if (!file) throw new BadRequestException('ກະລຸນາເລືອກໄຟລ໌ (No file provided)');

        // 1. ກວດສອບວ່າສັນຍາມີຈິງ ຫຼື ບໍ່
        const contract = await this.powerContractRepo.findById(powerContractId);
        if (!contract) throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contract not found)');

        // 2. ບັນທຶກຂໍ້ມູນໄຟລ໌ລົງຖານຂໍ້ມູນ
        const attachment = await this.attachmentRepo.createAttachment({
            powerContractId,
            fileName: file.originalname,
            storageKey: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: userId,
        });

        return { message: 'ອັບໂຫຼດໄຟລ໌ແນບສຳເລັດ', data: attachment };
    }
}

