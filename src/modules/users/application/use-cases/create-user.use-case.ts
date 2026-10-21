import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        private readonly configService: ConfigService,
    ) { }

    async execute(dto: CreateUserDto, currentUserId: string) {
        // 1. ກວດສອບວ່າມີລະຫັດພະນັກງານນີ້ຢູ່ໃນລະບົບແລ້ວຫຼືບໍ່ (ສະເພາະບັນຊີທີ່ຍັງບໍ່ຖືກລົບ)
        const existing = await this.userRepository.findByEmployeeCode(dto.employeeCode);

        if (existing && !existing.deletedAt) {
            throw new ConflictException(`ພະນັກງານລະຫັດ ${dto.employeeCode} ມີໃນລະບົບແລ້ວ`);
        }

        // 2. ເຊື່ອມຕໍ່ HRM ເພື່ອດຶງຂໍ້ມູນພະນັກງານອັດຕະໂນມັດຕາມລະຫັດພະນັກງານ
        const hrmUser = this.configService.get<string>('HRM_SYNC_USERNAME') || 'Ton';
        const hrmPass = this.configService.get<string>('HRM_SYNC_PASSWORD') || 'HRM1234';

        const hrmToken = await this.hrmApiService.login(hrmUser, hrmPass);
        const hrmEmployee = await this.hrmApiService.getEmployeeByCode(hrmToken, dto.employeeCode);

        // 3. ຈັດການຂໍ້ມູນຈາກ HRM ອັດຕະໂນມັດ
        const empCode = hrmEmployee.emp_code || dto.employeeCode;
        const fullName = `${hrmEmployee.first_name_la} ${hrmEmployee.last_name_la}`.trim();
        const department = hrmEmployee.office?.department?.department_name || '';
        const division = hrmEmployee.office?.division?.division_name || '';
        const unit = hrmEmployee.office?.unit?.unit_name || '';
        const position = hrmEmployee.office?.position?.pos_name || '';
        const email = hrmEmployee.email || `${empCode}@edl.com.la`;
        const phone = hrmEmployee.phone || '';

        const defaultPassword = `EDL@${empCode}`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // 4. ບັນທຶກລົງຖານຂໍ້ມູນພ້ອມ Audit Log
        const newUser = await this.userRepository.createOrRestoreFromHrm(
            {
                employeeCode: empCode,
                username: empCode,
                email,
                passwordHash,
                fullName,
                department,
                division,
                unit,
                position,
                phone,
                role: dto.role || UserRole.VIEWER,
                canView: dto.canView !== undefined ? dto.canView : true,
                canUpload: dto.canUpload || false,
                canEdit: dto.canEdit || false,
                canDelete: dto.canDelete || false,
                canDownload: dto.canDownload || false,
            },
            currentUserId,
        );

        return {
            message: 'ເພີ່ມຜູ້ໃຊ້ໂດຍການ Sync ຂໍ້ມູນຈາກ HRM ສຳເລັດ',
            data: newUser,
        };
    }
}
