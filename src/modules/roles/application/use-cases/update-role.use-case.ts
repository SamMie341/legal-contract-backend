import { Injectable, Inject } from '@nestjs/common';
import { UpdateRoleDto } from '../dto/update-role.dto.js';
import * as repoInterface from '../../domain/repositories/role.repository.interface.js';

@Injectable()
export class UpdateRoleUseCase {
    constructor(
        @Inject(repoInterface.ROLE_REPOSITORY)
        private readonly roleRepo: repoInterface.IRoleRepository,
    ) { }

    async execute(id: string, dto: UpdateRoleDto, userId?: string) {
        const updated = await this.roleRepo.updateRole(id, dto, userId);
        return {
            message: 'ແກ້ໄຂຂໍ້ມູນບົດບາດສຳເລັດ',
            data: updated,
        };
    }
}
