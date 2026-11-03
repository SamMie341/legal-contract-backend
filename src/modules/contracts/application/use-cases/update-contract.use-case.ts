import { Injectable, Inject, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class UpdateContractUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, dto: UpdateContractDto, user: any) {
        // 1. ตรวจสอบสิทธิ์การแก้ไข (Admin, Main User, หรือผู้มีสิทธิ์ canEdit ตาม Division)
        if (!canAccessModule(user, SystemModule.CONTRACTS, 'canEdit')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນສັນຍາ');
        }

        // 2. ถ้ามีการเปลี่ยนประเภทสัญญา ให้ตรวจสอบว่าประเภทใหม่มีอยู่จริง
        if (dto.contractTypeId) {
            const contractType = await this.contractRepository.findContractTypeById(dto.contractTypeId);
            if (!contractType) {
                throw new BadRequestException('ບໍ່ພົບປະເພດສັນຍາທີ່ເລືອກ');
            }
        }

        // 3. บันทึกการแก้ไขพร้อม Audit Log
        const updated = await this.contractRepository.updateContractWithAudit(id, dto, user.userId);

        return {
            message: 'ແກ້ໄຂຂໍ້ມູນສັນຍາສຳເລັດ',
            data: updated,
        };
    }
}
