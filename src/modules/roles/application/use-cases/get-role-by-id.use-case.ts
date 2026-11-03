import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/role.repository.interface.js';

@Injectable()
export class GetRoleByIdUseCase {
    constructor(
        @Inject(repoInterface.ROLE_REPOSITORY)
        private readonly roleRepo: repoInterface.IRoleRepository,
    ) { }

    async execute(id: string) {
        const role = await this.roleRepo.findById(id);
        if (!role) {
            throw new NotFoundException('ບໍ່ພົບບົດບາດ (Role not found)');
        }
        return {
            message: 'ດຶງຂໍ້ມູນບົດບາດສຳເລັດ',
            data: role,
        };
    }
}
