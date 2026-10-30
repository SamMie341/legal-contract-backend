import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(id: string) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ');
        }

        return {
            message: 'ດຶງຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ',
            data: user,
        };
    }
}
