import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';
import { CreateDepartmentDto } from '../dto/create-department.dto.js';

@Injectable()
export class CreateDepartmentUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute(dto: CreateDepartmentDto) {
        const existingName = await this.departmentRepo.findByName(dto.name);
        if (existingName) {
            throw new ConflictException('ຊື່ຫ້ອງການ/ຝ່າຍ (name) ນີ້ມີໃນລະບົບແລ້ວ');
        }

        if (dto.code) {
            const existingCode = await this.departmentRepo.findByCode(dto.code);
            if (existingCode) {
                throw new ConflictException('ລະຫັດຫ້ອງການ/ຝ່າຍ (code) ນີ້ມີໃນລະບົບແລ້ວ');
            }
        }

        const created = await this.departmentRepo.create(dto);

        return {
            message: 'ສ້າງຫ້ອງການ/ຝ່າຍໃໝ່ສຳເລັດ',
            data: created,
        };
    }
}
