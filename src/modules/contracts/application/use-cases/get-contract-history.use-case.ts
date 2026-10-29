import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { GetContractHistoryDto } from '../dto/get-contract-history.dto.js';
import { formatContractAuditLog } from '../helpers/contract-history-formatter.helper.js';
import { isGeneralContractDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetContractHistoryUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(id: string, query: GetContractHistoryDto, user?: any) {
        // 1. ກວດສອບສິດການເຂົ້າເຖິງ (Admin, Main User ຫຼື ຜູ້ມີສິດ canView ຕາມ Division)
        if (
            user &&
            user.role !== UserRole.ADMIN &&
            (!isGeneralContractDivision(user.division) || user.canView === false)
        ) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງປະຫວັດການແກ້ໄຂສັນຍາ (ອະນຸຍາດສະເພາະ ພະແນກສັນຍາທົ່ວໄປ)');
        }

        // 2. ກວດສອບວ່າສັນຍານີ້ມີຢູ່ແທ້ບໍ່
        const contract = await this.contractRepository.findById(id);
        if (!contract) {
            throw new NotFoundException('ບໍ່ພົບສັນຍາທີ່ຕ້ອງການ (Contract not found)');
        }

        // 3. ຄິດໄລ່ Pagination
        const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = query.limit && Number(query.limit) > 0 ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        // 4. ດຶງຂໍ້ມູນ Audit Logs ຈາກ Repository
        const { data, total } = await this.contractRepository.getContractHistory(id, {
            skip,
            take: limit,
            action: query.action,
        });

        // 5. ແປງຂໍ້ມູນໃຫ້ອ່ານງ່າຍ ແລະ ສະແດງສະເພາະຈຸດທີ່ມີການປ່ຽນແປງ (Formatted Diff)
        const formattedHistory = data.map((log) => formatContractAuditLog(log));

        return {
            message: 'ດຶງປະຫວັດການແກ້ໄຂສັນຍາສຳເລັດ',
            contract: {
                id: contract.id,
                title: contract.title,
                contractNumber: contract.contractNumber,
                status: contract.status,
            },
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: formattedHistory,
        };
    }
}
