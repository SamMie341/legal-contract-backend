import { Module } from '@nestjs/common';
import { ContractTypesController } from './presentation/contract-types.controller.js';

import { GetContractTypesUseCase } from './application/use-cases/get-contract-types.use-case.js';
import { GetContractTypesDropdownUseCase } from './application/use-cases/get-contract-types-dropdown.use-case.js';
import { GetContractTypeByIdUseCase } from './application/use-cases/get-contract-type-by-id.use-case.js';
import { CreateContractTypeUseCase } from './application/use-cases/create-contract-type.use-case.js';
import { UpdateContractTypeUseCase } from './application/use-cases/update-contract-type.use-case.js';
import { DeleteContractTypeUseCase } from './application/use-cases/delete-contract-type.use-case.js';

import { CONTRACT_TYPE_REPOSITORY } from './domain/repositories/contract-type.repository.interface.js';
import { ContractTypeRepository } from './infrastructure/repositories/contract-type.repository.js';

@Module({
    controllers: [ContractTypesController],
    providers: [
        GetContractTypesUseCase,
        GetContractTypesDropdownUseCase,
        GetContractTypeByIdUseCase,
        CreateContractTypeUseCase,
        UpdateContractTypeUseCase,
        DeleteContractTypeUseCase,
        {
            provide: CONTRACT_TYPE_REPOSITORY,
            useClass: ContractTypeRepository,
        },
    ],
    exports: [
        CONTRACT_TYPE_REPOSITORY,
        GetContractTypesUseCase,
        GetContractTypesDropdownUseCase,
    ],
})
export class ContractTypesModule { }
