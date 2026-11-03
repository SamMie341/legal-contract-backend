import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module.js';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.interface.js';
import { RoleRepository } from './infrastructure/repositories/role.repository.js';

import { CreateRoleUseCase } from './application/use-cases/create-role.use-case.js';
import { GetRolesUseCase } from './application/use-cases/get-roles.use-case.js';
import { GetRoleByIdUseCase } from './application/use-cases/get-role-by-id.use-case.js';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case.js';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case.js';

import { RolesController } from './presentation/roles.controller.js';

@Module({
    imports: [PrismaModule],
    controllers: [RolesController],
    providers: [
        {
            provide: ROLE_REPOSITORY,
            useClass: RoleRepository,
        },
        CreateRoleUseCase,
        GetRolesUseCase,
        GetRoleByIdUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
    ],
    exports: [ROLE_REPOSITORY],
})
export class RolesModule { }
