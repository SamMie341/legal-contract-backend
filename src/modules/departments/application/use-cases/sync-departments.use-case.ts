import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class SyncDepartmentsUseCase {
    constructor(
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        @Inject(departmentRepoInterface.DEPARTMENT_REPOSITORY)
        private readonly departmentRepo: departmentRepoInterface.IDepartmentRepository,
        private readonly configService: ConfigService,
    ) { }

    async execute() {
        const hrmUser = this.configService.get<string>('HRM_SYNC_USERNAME') || 'Ton';
        const hrmPass = this.configService.get<string>('HRM_SYNC_PASSWORD') || 'HRM1234';

        const token = await this.hrmApiService.login(hrmUser, hrmPass);
        const hrmDepartments = await this.hrmApiService.getDepartments(token);

        let createdCount = 0;
        let updatedCount = 0;
        const syncedList = [];

        for (const item of hrmDepartments) {
            const { department, action } = await this.departmentRepo.upsertFromHrm({
                name: item.department_name,
                code: item.department_code || undefined,
                isActive: item.department_status === 'A',
            });

            if (action === 'created') createdCount++;
            if (action === 'updated') updatedCount++;

            syncedList.push(department);
        }

        return {
            message: 'Sync ຂໍ້ມູນຫ້ອງການ/ຝ່າຍຈາກ HRM ສຳເລັດ',
            totalFromHrm: hrmDepartments.length,
            createdCount,
            updatedCount,
            data: syncedList,
        };
    }
}
