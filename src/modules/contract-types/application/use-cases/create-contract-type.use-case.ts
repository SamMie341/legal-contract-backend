import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';
import { CreateContractTypeDto } from '../dto/create-contract-type.dto.js';

@Injectable()
export class CreateContractTypeUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute(dto: CreateContractTypeDto) {
        const existing = await this.contractTypeRepo.findByNameLo(dto.nameLo);

        if (existing) {
            throw new ConflictException('ຊື່ປະເພດສັນຍາ (nameLo) ນີ້ມີໃນລະບົບແລ້ວ');
        }

        const created = await this.contractTypeRepo.create(dto);

        return {
            message: 'ສ້າງປະເພດສັນຍາໃໝ່ສຳເລັດ',
            data: created,
        };
    }
}
