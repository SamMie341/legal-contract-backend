import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './presentation/users.controller.js';

import { GetHrmEmployeeUseCase } from './application/use-cases/get-hrm-employee.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case.js';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case.js';

import { USER_REPOSITORY } from './domain/repositories/user.repository.interface.js';
import { UserRepository } from './infrastructure/repositories/user.repository.js';

@Module({
    imports: [AuthModule],
    controllers: [UsersController],
    providers: [
        GetHrmEmployeeUseCase,
        CreateUserUseCase,
        GetUsersUseCase,
        GetUserByIdUseCase,
        UpdateUserUseCase,
        DeleteUserUseCase,
        {
            provide: USER_REPOSITORY,
            useClass: UserRepository,
        },
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule { }
