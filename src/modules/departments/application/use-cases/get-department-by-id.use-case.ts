import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class GetDepartmentByIdUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute(id: string) {
        const department = await this.departmentRepo.findById(id);

        if (!department) {
            throw new NotFoundException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ຕ້ອງການ (Department not found)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນຫ້ອງການ/ຝ່າຍສຳເລັດ',
            data: department,
        };
    }
}
