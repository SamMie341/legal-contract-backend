import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { isSameDivisionAndDepartment } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(id: string, currentUser?: any) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ');
        }

        const currentRole = currentUser ? String(currentUser?.roleRef?.name || currentUser?.role || '').toUpperCase() : '';
        if (currentRole === 'DIVISION_HEAD') {
            const isMatch = isSameDivisionAndDepartment(
                { division: currentUser?.division, department: currentUser?.department },
                { division: user.division, department: user.department },
            );
            if (!isMatch) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເບິ່ງຂໍ້ມູນຜູ້ໃຊ້ທີ່ຢູ່ຕ່າງພະແນກ');
            }
        }

        return {
            message: 'ດຶງຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ',
            data: user,
        };
    }
}
