import { Injectable, Inject } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class GetDepartmentsDropdownUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute() {
        const departments = await this.departmentRepo.findAllForDropdown();

        const dropdownData = departments.map((item) => ({
            id: item.id,
            value: item.id,
            name: item.name,
            code: item.code,
            label: item.code ? `${item.name} (${item.code})` : item.name,
        }));

        return {
            message: 'ດຶງຂໍ້ມູນຫ້ອງການ/ຝ່າຍສຳລັບ Dropdown ສຳເລັດ',
            total: dropdownData.length,
            data: dropdownData,
        };
    }
}
