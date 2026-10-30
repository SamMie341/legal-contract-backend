import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';

@Injectable()
export class DeleteUserUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(id: string, currentUserId: string) {
        if (id === currentUserId) {
            throw new BadRequestException('ບໍ່ສາມາດລົບບັນຊີຂອງຕົນເອງໄດ້');
        }

        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ');
        }

        await this.userRepository.softDeleteWithAudit(id, user, currentUserId);

        return {
            message: 'ລົບບັນຊີຜູ້ໃຊ້ສຳເລັດ',
        };
    }
}
