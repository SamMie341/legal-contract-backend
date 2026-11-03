import { Injectable, Inject } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/role.repository.interface.js';

@Injectable()
export class DeleteRoleUseCase {
    constructor(
        @Inject(repoInterface.ROLE_REPOSITORY)
        private readonly roleRepo: repoInterface.IRoleRepository,
    ) { }

    async execute(id: string, userId?: string) {
        await this.roleRepo.deleteRole(id, userId);
        return {
            message: 'ລົບບົດບາດສຳເລັດ',
            data: { id },
        };
    }
}
