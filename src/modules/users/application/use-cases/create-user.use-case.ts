import { Injectable, Inject, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import * as hrmApiInterface from '../../../auth/domain/interface/hrm-api.interface.js';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import {
    isSameDivisionAndDepartment,
    getDefaultModulesByDivision,
    resolveToPrismaModules,
} from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class CreateUserUseCase {
    private readonly logger = new Logger(CreateUserUseCase.name);

    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        private readonly configService: ConfigService,
    ) { }

    async execute(dto: CreateUserDto, currentUser: any) {
        const currentUserId = typeof currentUser === 'string' ? currentUser : currentUser?.userId || currentUser?.id;
        const currentRole = typeof currentUser === 'object' ? String(currentUser?.roleRef?.name || currentUser?.role || '').toUpperCase() : '';
        const currentDivision = typeof currentUser === 'object' ? currentUser?.division : null;
        const currentDepartment = typeof currentUser === 'object' ? currentUser?.department : null;

        const isDivisionHead = currentRole === 'DIVISION_HEAD';

        // 1. ປ້ອງກັນ Privilege Escalation: DIVISION_HEAD ບໍ່ສາມາດສ້າງ ຫຼື ກຳນົດບົດບາດ ADMIN ຫຼື DEPARTMENT_HEAD ໄດ້
        if (isDivisionHead) {
            const targetRole = String(dto.role || UserRole.VIEWER).toUpperCase();
            if (targetRole === 'ADMIN' || targetRole === 'DEPARTMENT_HEAD') {
                throw new ForbiddenException(
                    `ຫົວໜ້າພະແນກ ບໍ່ສາມາດສ້າງ ຫຼື ກຳນົດບົດບາດ ${targetRole} ໄດ້ (ອະນຸຍາດສະເພາະ: MAIN_USER, EDITOR, VIEWER)`,
                );
            }

            if (dto.roleId) {
                const roleObj = await this.userRepository.findRoleById(dto.roleId);
                const roleName = String(roleObj?.name || '').toUpperCase();
                if (roleName === 'ADMIN' || roleName === 'DEPARTMENT_HEAD') {
                    throw new ForbiddenException(
                        `ຫົວໜ້າພະແນກ ບໍ່ສາມາດສ້າງ ຫຼື ກຳນົດບົດບາດ ${roleName} ໄດ້ (ອະນຸຍາດສະເພາະ: MAIN_USER, EDITOR, VIEWER)`,
                    );
                }
            }
        }

        // 2. ກວດສອບວ່າມີລະຫັດພະນັກງານນີ້ຢູ່ໃນລະບົບແລ້ວຫຼືບໍ່ (ສະເພາະບັນຊີທີ່ຍັງບໍ່ຖືກລົບ)
        const existing = await this.userRepository.findByEmployeeCode(dto.employeeCode);

        if (existing && !existing.deletedAt) {
            throw new ConflictException(`ພະນັກງານລະຫັດ ${dto.employeeCode} ມີໃນລະບົບແລ້ວ`);
        }

        // 3. ເຊື່ອມຕໍ່ HRM ເພື່ອດຶງຂໍ້ມູນພະນັກງານອັດຕະໂນມັດຕາມລະຫັດພະນັກງານ (ພ້ອມ fallback ຫາກ HRM ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້)
        let hrmEmployee: any = null;
        try {
            const hrmUser = this.configService.get<string>('HRM_SYNC_USERNAME') || 'Ton';
            const hrmPass = this.configService.get<string>('HRM_SYNC_PASSWORD') || 'HRM1234';

            const hrmToken = await this.hrmApiService.login(hrmUser, hrmPass);
            hrmEmployee = await this.hrmApiService.getEmployeeByCode(hrmToken, dto.employeeCode);
        } catch (error: any) {
            this.logger.warn(`Could not sync from HRM for employee ${dto.employeeCode}: ${error?.message || error}. Falling back to manual input.`);
        }

        // 4. ກວດສອບການຢູ່ສັງກັດພະແນກດຽວກັນ (Division & Department Boundary Enforcement)
        if (isDivisionHead) {
            if (hrmEmployee) {
                const empDept = hrmEmployee?.office?.department?.department_name || '';
                const empDiv = hrmEmployee?.office?.division?.division_name || '';

                const isMatch = isSameDivisionAndDepartment(
                    { division: currentDivision, department: currentDepartment },
                    { division: empDiv, department: empDept },
                );

                if (!isMatch) {
                    throw new ForbiddenException(
                        `ທ່ານບໍ່ມີສິດເພີ່ມພະນັກງານຕ່າງພະແນກ (ພະນັກງານລະຫັດ "${dto.employeeCode}" ສັງກັດພະແນກ: "${empDiv || 'ບໍ່ລະບຸ'}", ຝ່າຍ: "${empDept || 'ບໍ່ລະບຸ'}" ແຕ່ທ່ານສັງກັດພະແນກ: "${currentDivision || 'ບໍ່ລະບຸ'}")`,
                    );
                }
            } else if (dto.division) {
                // ກໍລະນີ Manual Input ຫາກລະບຸ division ມາ ຕ້ອງກົງກັບພະແນກຂອງຕົນເອງ
                const isMatch = isSameDivisionAndDepartment(
                    { division: currentDivision, department: currentDepartment },
                    { division: dto.division, department: dto.department },
                );

                if (!isMatch) {
                    throw new ForbiddenException(
                        `ທ່ານບໍ່ມີສິດເພີ່ມພະນັກງານໃນພະແນກອື່ນ (ທ່ານສາມາດເພີ່ມໄດ້ສະເພາະພະແນກ: "${currentDivision || 'ບໍ່ລະບຸ'}" ເທົ່ານັ້ນ)`,
                    );
                }
            }

            // ຈຳກັດ Module Permissions: ຫາກມີການສົ່ງມາ ຕ້ອງບໍ່ເກີນຂອບເຂດພະແນກຂອງຕົນເອງ
            if (dto.modulePermissions && dto.modulePermissions.length > 0) {
                const allowedModules = getDefaultModulesByDivision(currentDivision);
                const allowedPrismaModules = allowedModules.flatMap((m) => resolveToPrismaModules(m));
                for (const perm of dto.modulePermissions) {
                    const prismaMods = resolveToPrismaModules(perm.module);
                    for (const pm of prismaMods) {
                        if (!allowedPrismaModules.includes(pm)) {
                            throw new ForbiddenException(
                                `ຫົວໜ້າພະແນກ ບໍ່ສາມາດກຳນົດສິດໃນໂມດູນ "${perm.module}" ທີ່ຢູ່ນອກພະແນກຂອງຕົນເອງໄດ້`,
                            );
                        }
                    }
                }
            }
        }

        // 5. ຈັດການຂໍ້ມູນຈາກ HRM ຫຼື Fallback (ຫາກເປັນ DIVISION_HEAD ຈະຖືກ Lock ພະແນກໄວ້)
        const empCode = hrmEmployee?.emp_code || dto.employeeCode;
        const fullName = hrmEmployee
            ? `${hrmEmployee.first_name_la} ${hrmEmployee.last_name_la}`.trim()
            : (dto.fullName || dto.employeeCode);

        // ສຳລັບ DIVISION_HEAD ຫາກ HRM ບໍ່ມີຂໍ້ມູນ ຫຼື Manual ໃຫ້ໃຊ້ພະແນກ/ຝ່າຍ ຂອງ DIVISION_HEAD ເປັນຫຼັກ
        const department = isDivisionHead && currentDepartment
            ? currentDepartment
            : (dto.department || hrmEmployee?.office?.department?.department_name || '');
        const division = isDivisionHead && currentDivision
            ? currentDivision
            : (dto.division || hrmEmployee?.office?.division?.division_name || '');

        const unit = hrmEmployee?.office?.unit?.unit_name || '';
        const position = hrmEmployee?.office?.position?.pos_name || '';
        const rawEmail = dto.email?.trim() || hrmEmployee?.email?.trim();
        const email = rawEmail || null;
        const phone = dto.phone || hrmEmployee?.phone || '';

        const defaultPassword = `EDL@${empCode}`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // 6. ບັນທຶກລົງຖານຂໍ້ມູນພ້ອມ Audit Log
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
                roleId: dto.roleId,
                canView: dto.canView !== undefined ? dto.canView : true,
                canUpload: dto.canUpload || false,
                canEdit: dto.canEdit || false,
                canDelete: dto.canDelete || false,
                canDownload: dto.canDownload || false,
                modulePermissions: dto.modulePermissions,
            },
            currentUserId,
        );

        return {
            message: hrmEmployee ? 'ເພີ່ມຜູ້ໃຊ້ໂດຍການ Sync ຂໍ້ມູນຈາກ HRM ສຳເລັດ' : 'ເພີ່ມຜູ້ໃຊ້ສຳເລັດ',
            data: newUser,
        };
    }
}
