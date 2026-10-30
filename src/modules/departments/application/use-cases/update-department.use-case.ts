import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';
import { UpdateDepartmentDto } from '../dto/update-department.dto.js';

@Injectable()
export class UpdateDepartmentUseCase {
    constructor(
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
    ) { }

    async execute(id: string, dto: UpdateDepartmentDto) {
        const existing = await this.departmentRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຝ່າຍທີ່ຕ້ອງການແກ້ໄຂ');
        }

        if (dto.name !== undefined) {
            const duplicateName = await this.departmentRepo.findByName(dto.name, id);
            if (duplicateName) {
                throw new ConflictException('ຊື່ຝ່າຍນີ້ຊ້ຳກັບລາຍການອື່ນໃນລະບົບ');
            }
        }

        if (dto.code !== undefined && dto.code !== null && dto.code !== '') {
            const duplicateCode = await this.departmentRepo.findByCode(dto.code, id);
            if (duplicateCode) {
                throw new ConflictException('ລະຫັດຝ່າຍນີ້ຊ້ຳກັບລາຍການອື່ນໃນລະບົບ');
            }
        }

        const updated = await this.departmentRepo.update(id, dto);

        return {
            message: 'ແກ້ໄຂຝ່າຍສຳເລັດ',
            data: updated,
        };
    }
}
