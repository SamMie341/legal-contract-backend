import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { formatContractAuditLog } from '../helpers/contract-history-formatter.helper.js';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetContractByIdUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, user?: any) {
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isGeneralContractDivision(user.division) || user.canView === false)
        ) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນສັນຍາ');
        }

        const contract = await this.contractRepository.findById(id);

        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາທີ່ຕ້ອງການ');
        }

        // Format recent audit logs
        if (contract.auditLogs && Array.isArray(contract.auditLogs)) {
            contract.auditLogs = contract.auditLogs.map((log: any) => formatContractAuditLog(log));
        }

        return {
            message: 'ດຶງຂໍ້ມູນສັນຍາສຳເລັດ',
            data: contract,
        };
    }
}
