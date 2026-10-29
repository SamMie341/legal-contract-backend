import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';
import { GetPowerContractHistoryDto } from '../dto/get-power-contract-history.dto.js';
import { formatPowerContractAuditLog } from '../helpers/power-contract-history-formatter.helper.js';

@Injectable()
export class GetPowerContractHistoryUseCase {
    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    async execute(contractId: string, query: GetPowerContractHistoryDto, _user?: any) {
        const contract = await this.powerContractRepository.findById(contractId);
        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້ານີ້ໃນລະບົບ (Power Contract not found)');
        }

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const { data, total } = await this.powerContractRepository.getContractHistory(contractId, {
            skip,
            take: limit,
            action: query.action,
        });

        const formattedData = data.map((log) => formatPowerContractAuditLog(log));

        return {
            message: 'ດຶງປະຫວັດການແກ້ໄຂສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            contract: {
                id: contract.id,
                projectName: contract.projectName,
                contractType: contract.contractType,
                contractNumber: contract.contractNumber,
            },
            data: formattedData,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

