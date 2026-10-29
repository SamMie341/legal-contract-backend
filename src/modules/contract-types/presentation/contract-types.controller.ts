import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
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

import { CreateContractTypeDto } from '../application/dto/create-contract-type.dto.js';
import { UpdateContractTypeDto } from '../application/dto/update-contract-type.dto.js';

import { GetContractTypesUseCase } from '../application/use-cases/get-contract-types.use-case.js';
import { GetContractTypesDropdownUseCase } from '../application/use-cases/get-contract-types-dropdown.use-case.js';
import { GetContractTypeByIdUseCase } from '../application/use-cases/get-contract-type-by-id.use-case.js';
import { CreateContractTypeUseCase } from '../application/use-cases/create-contract-type.use-case.js';
import { UpdateContractTypeUseCase } from '../application/use-cases/update-contract-type.use-case.js';
import { DeleteContractTypeUseCase } from '../application/use-cases/delete-contract-type.use-case.js';

@ApiTags('Contract Types (ການຈັດການປະເພດສັນຍາ CRUD & Dropdown)')
@ApiBearerAuth()
@Controller('contract-types')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.CONTRACT_TYPES)
export class ContractTypesController {
    constructor(
        private readonly getContractTypesUseCase: GetContractTypesUseCase,
        private readonly getContractTypesDropdownUseCase: GetContractTypesDropdownUseCase,
        private readonly getContractTypeByIdUseCase: GetContractTypeByIdUseCase,
        private readonly createContractTypeUseCase: CreateContractTypeUseCase,
        private readonly updateContractTypeUseCase: UpdateContractTypeUseCase,
        private readonly deleteContractTypeUseCase: DeleteContractTypeUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍການປະເພດສັນຍາສຳລັບ Dropdown (ສະເພາະທີ່ເປີດໃຊ້ງານ ພ້ອມ value/label)' })
    @Get('dropdown')
    async getDropdown() {
        return this.getContractTypesDropdownUseCase.execute();
    }

    @ApiOperation({ summary: 'ດຶງລາຍການປະເພດສັນຍາທັງໝົດ ພ້ອມຄົ້ນຫາ ແລະ ກັ່ນຕອງສະຖານະ' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @Get()
    async findAll(@Query() query: { search?: string; isActive?: string }) {
        return this.getContractTypesUseCase.execute(query);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນປະເພດສັນຍາຕາມ ID' })
    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.getContractTypeByIdUseCase.execute(id);
    }

    @ApiOperation({ summary: 'ສ້າງປະເພດສັນຍາໃໝ່ (Admin, Main User)' })
    @Post()
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async create(@Body() dto: CreateContractTypeDto) {
        return this.createContractTypeUseCase.execute(dto);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນປະເພດສັນຍາ (Admin, Main User)' })
    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MAIN_USER)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateContractTypeDto,
    ) {
        return this.updateContractTypeUseCase.execute(id, dto);
    }

    @ApiOperation({ summary: 'ລົບປະເພດສັນຍາ (Admin Only - ລົບໄດ້ສະເພາະປະເພດທີ່ຍັງບໍ່ມີສັນຍາຜູກຢູ່)' })
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.deleteContractTypeUseCase.execute(id);
    }
}
