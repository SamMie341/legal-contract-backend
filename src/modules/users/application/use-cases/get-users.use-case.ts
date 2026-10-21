import { Injectable, Inject } from '@nestjs/common';
import * as userRepoInterface from '../../domain/repositories/user.repository.interface.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class GetUsersUseCase {
    constructor(
        @Inject(userRepoInterface.USER_REPOSITORY)
        private readonly userRepository: userRepoInterface.IUserRepository,
    ) { }

    async execute(query: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        isActive?: string;
    }) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const isActive =
            query.isActive === undefined ? undefined : query.isActive === 'true';

        const result = await this.userRepository.findAll({
            skip,
            take: limit,
            search: query.search,
            role: query.role as UserRole | undefined,
            isActive,
        });

        return {
            message: 'ດຶງລາຍຊື່ຜູ້ໃຊ້ສຳເລັດ',
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
            data: result.data,
        };
    }
}
