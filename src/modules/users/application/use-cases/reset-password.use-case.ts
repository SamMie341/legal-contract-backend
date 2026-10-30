import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(targetUserId: string, dto: ResetPasswordDto, currentAdminId: string) {
        // 1. ກວດສອບວ່າ User ທີ່ຕ້ອງການ Reset ມີຕົວຕົນໃນລະບົບຫຼືບໍ່
        const user = await this.userRepository.findUserWithPassword(targetUserId);
        if (!user || user.deletedAt) {
            throw new NotFoundException(`ບໍ່ພົບຜູ້ໃຊ້ລະຫັດ ${targetUserId} ໃນລະບົບ`);
        }

        // 2. ກຳນົດລະຫັດຜ່ານໃໝ່: ຫາກບໍ່ໄດ້ລະບຸ ໃຫ້ໃຊ້ Default EDL@{empCode} ຫຼື EDL@123456
        const newPassword = dto?.newPassword?.trim() || `EDL@${user.employeeCode || '123456'}`;

        // 3. Hash ລະຫັດຜ່ານໃໝ່
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 4. ອັບເດດລະຫັດຜ່ານພ້ອມ Audit Log
        await this.userRepository.updatePasswordWithAudit(
            user.id,
            passwordHash,
            currentAdminId,
            'RESET_BY_ADMIN',
        );

        return {
            message: 'ຣີເຊັດລະຫັດຜ່ານສຳເລັດ (Password reset successfully)',
            data: {
                userId: user.id,
                employeeCode: user.employeeCode,
                username: user.username,
                temporaryPassword: newPassword,
            },
        };
    }
}
