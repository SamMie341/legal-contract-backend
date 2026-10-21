import { Injectable, Inject } from '@nestjs/common';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class GetDashboardStatsUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute() {
        const stats = await this.contractRepository.getDashboardStats();

        // จัดรูปแบบข้อมูลให้ Frontend นำไปใช้งานง่ายขึ้น
        return {
            message: 'ດຶງຂໍ້ມູນ Dashboard ສຳເລັດ',
            data: {
                summary: {
                    totalContracts: stats.total,
                },
                statusChart: stats.byStatus.map(s => ({ status: s.status, count: s._count.id })),
                currencyChart: stats.byCurrency.map(c => ({ currency: c.currency, count: c._count.id })),
                typeChart: stats.byContractType,
            }
        };
    }
}