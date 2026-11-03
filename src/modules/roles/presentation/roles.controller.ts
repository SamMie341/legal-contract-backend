import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case.js';
import { GetRolesUseCase } from '../application/use-cases/get-roles.use-case.js';
import { GetRoleByIdUseCase } from '../application/use-cases/get-role-by-id.use-case.js';
import { UpdateRoleUseCase } from '../application/use-cases/update-role.use-case.js';
import { DeleteRoleUseCase } from '../application/use-cases/delete-role.use-case.js';

import { CreateRoleDto } from '../application/dto/create-role.dto.js';
import { UpdateRoleDto } from '../application/dto/update-role.dto.js';

@ApiTags('Roles Management (ການຈັດການບົດບາດ ແລະ ສິດຂອງ Role)')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
    constructor(
        private readonly createRoleUseCase: CreateRoleUseCase,
        private readonly getRolesUseCase: GetRolesUseCase,
        private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
        private readonly updateRoleUseCase: UpdateRoleUseCase,
        private readonly deleteRoleUseCase: DeleteRoleUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍຊື່ບົດບາດທັງໝົດ ພ້ອມສິດລາຍໂມດູນ ແລະ ຈຳນວນຜູ້ໃຊ້' })
    @Get()
    async getRoles() {
        return this.getRolesUseCase.execute();
    }

    @ApiOperation({ summary: 'ດຶງລາຍລະອຽດບົດບາດຕາມ ID' })
    @Get(':id')
    async getRoleById(@Param('id', ParseUUIDPipe) id: string) {
        return this.getRoleByIdUseCase.execute(id);
    }

    @ApiOperation({ summary: 'ສ້າງບົດບາດໃໝ່ (Admin Only) ພ້ອມກຳນົດສິດ Matrix ທັງ 4 ໂມດູນ' })
    @Roles(UserRole.ADMIN)
    @Post()
    async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: any) {
        return this.createRoleUseCase.execute(dto, user?.userId || user?.id);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຊື່, ຄຳອະທິບາຍ ຫຼື ສິດ Matrix ຂອງບົດບາດ (Admin Only)' })
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    async updateRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() user: any,
    ) {
        return this.updateRoleUseCase.execute(id, dto, user?.userId || user?.id);
    }

    @ApiOperation({ summary: 'ລົບບົດບາດ (Admin Only - ຫ້າມລົບ System Role ແລະ Role ທີ່ມີ User ໃຊ້ຢູ່)' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    async deleteRole(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
        return this.deleteRoleUseCase.execute(id, user?.userId || user?.id);
    }
}
