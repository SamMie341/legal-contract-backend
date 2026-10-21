import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';

@Injectable()
export class UpdateUserUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(id: string, dto: UpdateUserDto, currentUserId: string) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ (User not found)');
        }

        const updatedUser = await this.userRepository.updateWithAudit(id, dto, user, currentUserId);

        return {
            message: 'ອັບເດດຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ',
            data: updatedUser,
        };
    }
}
