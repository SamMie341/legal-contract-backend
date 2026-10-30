import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';

@Injectable()
export class DeleteContractTypeUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute(id: number) {
        const existing = await this.contractTypeRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບປະເພດສັນຍາທີ່ຕ້ອງການລົບ');
        }

        const contractCount = await this.contractTypeRepo.countContractsByTypeId(id);
        if (contractCount > 0) {
            throw new BadRequestException(
                `ບໍ່ສາມາດລົບປະເພດສັນຍານີ້ໄດ້ ເນື່ອງຈາກມີສັນຍາທີ່ຜູກກັບປະເພດນີ້ຢູ່ ${contractCount} ສະບັບ (ກະລຸນາປິດການໃຊ້ງານແທນ)`,
            );
        }

        await this.contractTypeRepo.delete(id);

        return {
            message: 'ລົບປະເພດສັນຍາສຳເລັດ',
        };
    }
}
