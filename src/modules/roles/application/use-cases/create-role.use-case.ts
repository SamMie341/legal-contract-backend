import { Injectable, Inject } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import * as repoInterface from '../../domain/repositories/role.repository.interface.js';

@Injectable()
export class CreateRoleUseCase {
    constructor(
        @Inject(repoInterface.ROLE_REPOSITORY)
        private readonly roleRepo: repoInterface.IRoleRepository,
    ) { }

    async execute(dto: CreateRoleDto, userId?: string) {
        const role = await this.roleRepo.createRole(dto, userId);
        return {
            message: 'ສ້າງບົດບາດໃໝ່ສຳເລັດ',
            data: role,
        };
    }
}
