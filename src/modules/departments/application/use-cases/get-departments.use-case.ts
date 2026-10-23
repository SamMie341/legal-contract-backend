import { Injectable, Inject } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class GetDepartmentsUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute(query?: { search?: string; isActive?: string }) {
        const isActive =
            query?.isActive === undefined
                ? undefined
                : query.isActive === 'true';

        const departments = await this.departmentRepo.findAll({
            search: query?.search,
            isActive,
        });

        return {
            message: 'ດຶງລາຍການຫ້ອງການ/ຝ່າຍສຳເລັດ',
            total: departments.length,
            data: departments,
        };
    }
}
