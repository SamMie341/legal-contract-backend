import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';

import { CreateDepartmentDto } from '../application/dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../application/dto/update-department.dto.js';

import { GetDepartmentsUseCase } from '../application/use-cases/get-departments.use-case.js';
import { GetDepartmentsDropdownUseCase } from '../application/use-cases/get-departments-dropdown.use-case.js';
import { GetDepartmentByIdUseCase } from '../application/use-cases/get-department-by-id.use-case.js';
import { CreateDepartmentUseCase } from '../application/use-cases/create-department.use-case.js';
import { UpdateDepartmentUseCase } from '../application/use-cases/update-department.use-case.js';
import { DeleteDepartmentUseCase } from '../application/use-cases/delete-department.use-case.js';
import { GetHrmDepartmentsUseCase } from '../application/use-cases/get-hrm-departments.use-case.js';
import { SyncDepartmentsUseCase } from '../application/use-cases/sync-departments.use-case.js';

@ApiTags('Departments (ການຈັດການຫ້ອງການ/ຝ່າຍ CRUD, Sync HRM & Dropdown)')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.DEPARTMENTS)
export class DepartmentsController {
    constructor(
        private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
        private readonly getDepartmentsDropdownUseCase: GetDepartmentsDropdownUseCase,
        private readonly getDepartmentByIdUseCase: GetDepartmentByIdUseCase,
        private readonly createDepartmentUseCase: CreateDepartmentUseCase,
        private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
        private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
        private readonly getHrmDepartmentsUseCase: GetHrmDepartmentsUseCase,
        private readonly syncDepartmentsUseCase: SyncDepartmentsUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍການຫ້ອງການ/ຝ່າຍສຳລັບ Dropdown (ສະເພາະທີ່ເປີດໃຊ້ງານ ພ້ອມ value/label)' })
    @Get('dropdown')
    async getDropdown() {
        return this.getDepartmentsDropdownUseCase.execute();
    }

    @ApiOperation({ summary: 'ດຶງລາຍຊື່ຫ້ອງການ/ຝ່າຍຈາກ HRM ມາ Preview ເບິ່ງກ່ອນ Sync' })
    @Get('hrm')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async getHrmDepartments() {
        return this.getHrmDepartmentsUseCase.execute();
    }

    @ApiOperation({ summary: 'Sync ຂໍ້ມູນຫ້ອງການ/ຝ່າຍທັງໝົດຈາກ HRM ເຂົ້າສູ່ລະບົບ (GET - Admin, Main User)' })
    @Get('sync')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async syncDepartmentsGet() {
        return this.syncDepartmentsUseCase.execute();
    }

    @ApiOperation({ summary: 'Sync ຂໍ້ມູນຫ້ອງການ/ຝ່າຍທັງໝົດຈາກ HRM ເຂົ້າສູ່ລະບົບ (POST - Admin, Main User)' })
    @Post('sync')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async syncDepartments() {
        return this.syncDepartmentsUseCase.execute();
    }

    @ApiOperation({ summary: 'ດຶງລາຍການຫ້ອງການ/ຝ່າຍທັງໝົດ ພ້ອມຄົ້ນຫາ ແລະ ກັ່ນຕອງສະຖານະ' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @Get()
    async findAll(@Query() query: { search?: string; isActive?: string }) {
        return this.getDepartmentsUseCase.execute(query);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນຫ້ອງການ/ຝ່າຍຕາມ ID' })
    @Get(':id')
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.getDepartmentByIdUseCase.execute(id);
    }

    @ApiOperation({ summary: 'ສ້າງຫ້ອງການ/ຝ່າຍໃໝ່ (Admin, Main User)' })
    @Post()
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async create(@Body() dto: CreateDepartmentDto) {
        return this.createDepartmentUseCase.execute(dto);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນຫ້ອງການ/ຝ່າຍ (Admin, Main User)' })
    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateDepartmentDto,
    ) {
        return this.updateDepartmentUseCase.execute(id, dto);
    }

    @ApiOperation({ summary: 'ລົບຫ້ອງການ/ຝ່າຍ (Admin Only - ລົບໄດ້ສະເພາະທີ່ຍັງບໍ່ມີນິຕິກຳ ຫຼື ຄະດີຜູກມັດຢູ່)' })
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.deleteDepartmentUseCase.execute(id);
    }
}
