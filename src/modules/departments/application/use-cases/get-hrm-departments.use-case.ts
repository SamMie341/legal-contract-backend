import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as departmentRepoInterface from '../../domain/repositories/department.repository.interface.js';

@Injectable()
export class GetHrmDepartmentsUseCase {
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

        const localDepartments = await this.departmentRepo.findAll({});
        const existingCodes = new Set(localDepartments.map((d) => d.code).filter(Boolean));
        const existingNames = new Set(localDepartments.map((d) => d.name));

        const formatted = hrmDepartments.map((dept) => ({
            departmentId: dept.department_id,
            code: dept.department_code,
            name: dept.department_name,
            phone: dept.department_phone || '',
            email: dept.department_email || '',
            status: dept.department_status,
            isActive: dept.department_status === 'A',
            alreadyInSystem:
                (Boolean(dept.department_code) && existingCodes.has(dept.department_code)) ||
                existingNames.has(dept.department_name),
        }));

        return {
            message: 'ດຶງຂໍ້ມູນຫ້ອງການ/ຝ່າຍຈາກ HRM ສຳເລັດ',
            total: formatted.length,
            data: formatted,
        };
    }
}
