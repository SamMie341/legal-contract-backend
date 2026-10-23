import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class GetDashboardStatsUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(user?: any) {
        if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MAIN_USER && user.canView === false) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງຂໍ້ມູນສັນຍາ (Permission Denied: canView required)');
        }

        const stats = await this.contractRepository.getDashboardStats();

        return {
            message: 'ດຶງຂໍ້ມູນ Dashboard ສຳເລັດ',
            data: {
                summary: {
                    totalContracts: stats.total,
                    expiringSoonCount: stats.expiringSoonCount,
                    expiredCount: stats.expiredCount,
                },
                statusChart: stats.byStatus.map((s) => ({ status: s.status, count: s._count.id })),
                currencyChart: stats.byCurrency.map((c) => ({ currency: c.currency, count: c._count.id })),
                valueByCurrency: stats.valueByCurrency,
                typeChart: stats.byContractType,
            },
        };
    }
}
