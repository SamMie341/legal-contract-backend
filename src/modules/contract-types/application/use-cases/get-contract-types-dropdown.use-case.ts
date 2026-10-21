import { Injectable, Inject } from '@nestjs/common';
import * as contractTypeRepoInterface from '../../domain/repositories/contract-type.repository.interface.js';

@Injectable()
export class GetContractTypesDropdownUseCase {
    constructor(
        @Inject(contractTypeRepoInterface.CONTRACT_TYPE_REPOSITORY)
        private readonly contractTypeRepo: contractTypeRepoInterface.IContractTypeRepository,
    ) { }

    async execute() {
        const types = await this.contractTypeRepo.findAllForDropdown();

        const dropdownData = types.map((item) => ({
            id: item.id,
            value: item.id,
            nameLo: item.nameLo,
            nameEn: item.nameEn,
            label: item.nameLo,
        }));

        return {
            message: 'ດຶງຂໍ້ມູນປະເພດສັນຍາສຳລັບ Dropdown ສຳເລັດ',
            total: dropdownData.length,
            data: dropdownData,
        };
    }
}
