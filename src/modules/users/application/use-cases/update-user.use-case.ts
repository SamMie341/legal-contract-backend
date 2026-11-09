import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import {
    isSameDivision,
    isSameDivisionAndDepartment,
    getDefaultModulesByDivision,
    resolveToPrismaModules,
} from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UpdateUserUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(id: string, dto: UpdateUserDto, currentUser: any) {
        const currentUserId = typeof currentUser === 'string' ? currentUser : currentUser?.userId || currentUser?.id;
        const currentRole = typeof currentUser === 'object' ? String(currentUser?.roleRef?.name || currentUser?.role || '').toUpperCase() : '';
        const currentDivision = typeof currentUser === 'object' ? currentUser?.division : null;
        const currentDepartment = typeof currentUser === 'object' ? currentUser?.department : null;

        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ');
        }

        if (currentRole === 'DIVISION_HEAD') {
            const isMatch = isSameDivisionAndDepartment(
                { division: currentDivision, department: currentDepartment },
                { division: user.division, department: user.department },
            );
            if (!isMatch) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ທີ່ຢູ່ຕ່າງພະແນກ');
            }

            if (dto.role) {
                const targetRole = String(dto.role).toUpperCase();
                if (targetRole === 'ADMIN' || targetRole === 'DEPARTMENT_HEAD') {
                    throw new ForbiddenException(`ຫົວໜ້າພະແນກ ບໍ່ສາມາດກຳນົດບົດບາດ ${targetRole} ໄດ້ (ອະນຸຍາດສະເພາະ: MAIN_USER, EDITOR, VIEWER)`);
                }
            }

            if (dto.roleId) {
                const roleObj = await this.userRepository.findRoleById(dto.roleId);
                const roleName = String(roleObj?.name || '').toUpperCase();
                if (roleName === 'ADMIN' || roleName === 'DEPARTMENT_HEAD') {
                    throw new ForbiddenException(`ຫົວໜ້າພະແນກ ບໍ່ສາມາດກຳນົດບົດບາດ ${roleName} ໄດ້ (ອະນຸຍາດສະເພາະ: MAIN_USER, EDITOR, VIEWER)`);
                }
            }

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

            if (dto.division && !isSameDivision(currentDivision, dto.division)) {
                throw new ForbiddenException('ທ່ານບໍ່ສາມາດຍ້າຍພະແນກຂອງຜູ້ໃຊ້ໄປຕ່າງພະແນກໄດ້');
            }
        }

        const updatedUser = await this.userRepository.updateWithAudit(id, dto, user, currentUserId);

        return {
            message: 'ອັບເດດຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ',
            data: updatedUser,
        };
    }
}
