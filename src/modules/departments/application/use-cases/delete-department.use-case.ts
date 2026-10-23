import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class DeleteDepartmentUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute(id: string) {
        const existing = await this.departmentRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ຕ້ອງການລົບ (Department not found)');
        }

        const usage = await this.departmentRepo.countUsageById(id);
        if (usage.legalDocumentsCount > 0 || usage.legalCasesCount > 0) {
            throw new BadRequestException(
                `ບໍ່ສາມາດລົບຫ້ອງການ/ຝ່າຍນີ້ໄດ້ ເນື່ອງຈາກມີນິຕິກຳ (${usage.legalDocumentsCount}) ຫຼື ຄະດີ (${usage.legalCasesCount}) ຜູກມັດຢູ່ (ກະລຸນາປິດການໃຊ້ງານ isActive: false ແທນ)`,
            );
        }

        await this.departmentRepo.delete(id);

        return {
            message: 'ລົບຫ້ອງການ/ຝ່າຍສຳເລັດ',
        };
    }
}
