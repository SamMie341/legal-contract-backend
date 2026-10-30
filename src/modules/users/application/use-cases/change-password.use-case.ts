import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';

@Injectable()
export class ChangePasswordUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(currentUserId: string, dto: ChangePasswordDto) {
        // 1. ກວດສອບວ່າຜູ້ໃຊ້ມີຕົວຕົນໃນລະບົບ
        const user = await this.userRepository.findUserWithPassword(currentUserId);
        if (!user || user.deletedAt || !user.isActive) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ ຫຼື ບັນຊີຖືກລະງັບການນຳໃຊ້');
        }

        // 2. ກວດສອບຄວາມຖືກຕ້ອງຂອງ confirmPassword (ຫາກມີການສົ່ງມາ)
        if (dto.confirmPassword && dto.confirmPassword !== dto.newPassword) {
            throw new BadRequestException('ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ');
        }

        // 3. ກວດສອບລະຫັດຜ່ານປັດຈຸບັນ (Current Password)
        const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new BadRequestException('ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ');
        }

        // 4. ປ້ອງກັນການໃຊ້ລະຫັດຜ່ານຊ້ຳກັບອັນເກົ່າ
        const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new BadRequestException('ລະຫັດຜ່ານໃໝ່ຕ້ອງບໍ່ຄືກັບລະຫັດຜ່ານປັດຈຸບັນ');
        }

        // 5. Hash ລະຫັດຜ່ານໃໝ່
        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

        // 6. ອັບເດດລະຫັດຜ່ານພ້ອມບັນທຶກ Audit Log
        await this.userRepository.updatePasswordWithAudit(
            user.id,
            newPasswordHash,
            currentUserId,
            'CHANGED_BY_SELF',
        );

        return {
            message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ',
            data: {
                userId: user.id,
                username: user.username,
            },
        };
    }
}
