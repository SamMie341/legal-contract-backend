import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';
import { UpdateContractTypeDto } from '../dto/update-contract-type.dto.js';

@Injectable()
export class UpdateContractTypeUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute(id: number, dto: UpdateContractTypeDto) {
        const existing = await this.contractTypeRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບປະເພດສັນຍາທີ່ຕ້ອງການແກ້ໄຂ');
        }

        if (dto.nameLo !== undefined) {
            const duplicate = await this.contractTypeRepo.findByNameLo(dto.nameLo, id);
            if (duplicate) {
                throw new ConflictException('ຊື່ປະເພດສັນຍານີ້ຊ້ຳກັບລາຍການອື່ນໃນລະບົບ');
            }
        }

        const updated = await this.contractTypeRepo.update(id, dto);

        return {
            message: 'ແກ້ໄຂປະເພດສັນຍາສຳເລັດ',
            data: updated,
        };
    }
}
