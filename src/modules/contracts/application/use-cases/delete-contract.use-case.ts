import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class DeleteContractUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, user: any) {
        // ตรวจสอบสิทธิ์การลบ (Admin, Main User, หรือผู้มีสิทธิ์ canDelete)
        const canDelete = user.role === UserRole.ADMIN || user.role === UserRole.MAIN_USER || user.canDelete === true;
        if (!canDelete) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບສັນຍາ (Permission Denied: canDelete required)');
        }

        await this.contractRepository.deleteContractWithAudit(id, user.userId);

        return {
            message: 'ລົບສັນຍາສຳເລັດ',
        };
    }
}
