import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';

@Injectable()
export class GetHrmEmployeeUseCase {
    constructor(
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
        private readonly configService: ConfigService,
    ) { }

    async execute(empCode: string) {
        const hrmUser = this.configService.get<string>('HRM_SYNC_USERNAME') || 'Ton';
        const hrmPass = this.configService.get<string>('HRM_SYNC_PASSWORD') || 'HRM1234';

        const token = await this.hrmApiService.login(hrmUser, hrmPass);
        const hrmEmployee = await this.hrmApiService.getEmployeeByCode(token, empCode);

        const existingUser = await this.userRepository.findByEmployeeCode(hrmEmployee.emp_code);

        return {
            message: 'ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM ສຳເລັດ',
            data: {
                employeeCode: hrmEmployee.emp_code,
                fullName: `${hrmEmployee.first_name_la} ${hrmEmployee.last_name_la}`.trim(),
                department: hrmEmployee.office?.department?.department_name || '',
                division: hrmEmployee.office?.division?.division_name || '',
                unit: hrmEmployee.office?.unit?.unit_name || '',
                position: hrmEmployee.office?.position?.pos_name || '',
                email: hrmEmployee.email || `${hrmEmployee.emp_code}@edl.com.la`,
                phone: hrmEmployee.phone || '',
                alreadyInSystem: Boolean(existingUser && !existingUser.deletedAt),
            },
        };
    }
}
