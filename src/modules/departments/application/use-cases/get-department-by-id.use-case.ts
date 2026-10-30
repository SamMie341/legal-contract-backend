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
            throw new NotFoundException('ບໍ່ພົບຝ່າຍທີ່ຕ້ອງການ');
        }

        return {
            message: 'ດຶງຂໍ້ມູນຝ່າຍສຳເລັດ',
            data: department,
        };
    }
}
