import { Injectable, Inject } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/role.repository.interface.js';

@Injectable()
export class GetRolesUseCase {
    constructor(
        @Inject(repoInterface.ROLE_REPOSITORY)
        private readonly roleRepo: repoInterface.IRoleRepository,
    ) { }

    async execute() {
        const roles = await this.roleRepo.findAll();
        return {
            message: 'ດຶງລາຍການບົດບາດທັງໝົດສຳເລັດ',
            total: roles.length,
            data: roles,
        };
    }
}
