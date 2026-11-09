import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { isSameDivisionAndDepartment } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetHrmEmployeeUseCase {
    constructor(
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
        private readonly configService: ConfigService,
    ) { }

    async execute(empCode: string, currentUser?: any) {
        const hrmUser = this.configService.get<string>('HRM_SYNC_USERNAME') || 'Ton';
        const hrmPass = this.configService.get<string>('HRM_SYNC_PASSWORD') || 'HRM1234';

        const token = await this.hrmApiService.login(hrmUser, hrmPass);
        const hrmEmployee = await this.hrmApiService.getEmployeeByCode(token, empCode);

        const existingUser = await this.userRepository.findByEmployeeCode(hrmEmployee.emp_code);

        const empDepartment = hrmEmployee.office?.department?.department_name || '';
        const empDivision = hrmEmployee.office?.division?.division_name || '';

        let isSameDivision = true;
        let canAdd = true;
        let divisionMismatchWarning: string | null = null;

        const currentRole = currentUser ? String(currentUser?.roleRef?.name || currentUser?.role || '').toUpperCase() : '';
        if (currentRole === 'DIVISION_HEAD') {
            const isMatch = isSameDivisionAndDepartment(
                { division: currentUser?.division, department: currentUser?.department },
                { division: empDivision, department: empDepartment },
            );
            if (!isMatch) {
                isSameDivision = false;
                canAdd = false;
                divisionMismatchWarning = `ພະນັກງານລະຫັດນີ້ສັງກັດພະແນກ "${empDivision || 'ບໍ່ລະບຸ'}" (ຝ່າຍ: "${empDepartment || 'ບໍ່ລະບຸ'}") ເຊິ່ງບໍ່ແມ່ນພະແນກຂອງທ່ານ. ທ່ານບໍ່ສາມາດເພີ່ມຜູ້ໃຊ້ນີ້ໄດ້.`;
            }
        }

        return {
            message: 'ດຶງຂໍ້ມູນພະນັກງານຈາກ HRM ສຳເລັດ',
            data: {
                employeeCode: hrmEmployee.emp_code,
                fullName: `${hrmEmployee.first_name_la} ${hrmEmployee.last_name_la}`.trim(),
                department: empDepartment,
                division: empDivision,
                unit: hrmEmployee.office?.unit?.unit_name || '',
                position: hrmEmployee.office?.position?.pos_name || '',
                email: hrmEmployee.email?.trim() || null,
                phone: hrmEmployee.phone || '',
                alreadyInSystem: Boolean(existingUser && !existingUser.deletedAt),
                isSameDivision,
                canAdd,
                divisionMismatchWarning,
            },
        };
    }
}
