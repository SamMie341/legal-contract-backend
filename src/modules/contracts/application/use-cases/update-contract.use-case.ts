import { Injectable, Inject, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { UpdateContractDto } from '../dto/update-contract.dto.js';
import { UserRole } from '@prisma/client';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UpdateContractUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, dto: UpdateContractDto, user: any) {
        // 1. ตรวจสอบสิทธิ์การแก้ไข (Admin, Main User, หรือผู้มีสิทธิ์ canEdit ตาม Division)
        const isContractDiv = isGeneralContractDivision(user?.division);
        const canEdit =
            user.role === UserRole.ADMIN ||
            (isContractDiv && (user.role === UserRole.MAIN_USER || user.canEdit === true));
        if (!canEdit) {
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
