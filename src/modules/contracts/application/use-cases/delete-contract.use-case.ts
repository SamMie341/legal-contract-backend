import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { canAccessModule } from '../../../../core/utils/division-helper.util.js';
import { SystemModule } from '../../../../core/constants/division.constant.js';

@Injectable()
export class DeleteContractUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, user: any) {
        // ตรวจสอบสิทธิ์การลบ (Admin, Main User, หรือผู้มีสิทธิ์ canDelete ตาม Division)
        if (!canAccessModule(user, SystemModule.CONTRACTS, 'canDelete')) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບສັນຍາ');
        }

        await this.contractRepository.deleteContractWithAudit(id, user.userId);

        return {
            message: 'ລົບສັນຍາສຳເລັດ',
        };
    }
}
