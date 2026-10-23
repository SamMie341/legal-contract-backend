import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DepartmentsController } from './presentation/departments.controller.js';

import { GetDepartmentsUseCase } from './application/use-cases/get-departments.use-case.js';
import { GetDepartmentsDropdownUseCase } from './application/use-cases/get-departments-dropdown.use-case.js';
import { GetDepartmentByIdUseCase } from './application/use-cases/get-department-by-id.use-case.js';
import { CreateDepartmentUseCase } from './application/use-cases/create-department.use-case.js';
import { UpdateDepartmentUseCase } from './application/use-cases/update-department.use-case.js';
import { DeleteDepartmentUseCase } from './application/use-cases/delete-department.use-case.js';
import { GetHrmDepartmentsUseCase } from './application/use-cases/get-hrm-departments.use-case.js';
import { SyncDepartmentsUseCase } from './application/use-cases/sync-departments.use-case.js';

import { DEPARTMENT_REPOSITORY } from './domain/repositories/department.repository.interface.js';
import { DepartmentRepository } from './infrastructure/repositories/department.repository.js';

@Module({
    imports: [AuthModule],
    controllers: [DepartmentsController],
    providers: [
        GetDepartmentsUseCase,
        GetDepartmentsDropdownUseCase,
        GetDepartmentByIdUseCase,
        CreateDepartmentUseCase,
        UpdateDepartmentUseCase,
        DeleteDepartmentUseCase,
        GetHrmDepartmentsUseCase,
        SyncDepartmentsUseCase,
        {
            provide: DEPARTMENT_REPOSITORY,
            useClass: DepartmentRepository,
        },
    ],
    exports: [
        DEPARTMENT_REPOSITORY,
        GetDepartmentsUseCase,
        GetDepartmentsDropdownUseCase,
        GetDepartmentByIdUseCase,
    ],
})
export class DepartmentsModule { }
