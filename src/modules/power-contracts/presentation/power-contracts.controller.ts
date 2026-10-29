import { Controller, Post, Get, Patch, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { PowerContractType, ContractStatus } from '@prisma/client';

import { CreatePowerContractUseCase } from '../application/use-cases/create-power-contract.use-case.js';
import { CreatePowerContractDto } from '../application/dto/create-power-contract.dto.js';
import { UpdatePowerContractUseCase } from '../application/use-cases/update-power-contract.use-case.js';
import { UpdatePowerContractDto } from '../application/dto/update-power-contract.dto.js';
import { DeletePowerContractUseCase } from '../application/use-cases/delete-power-contract.use-case.js';
import { GetPowerContractsUseCase } from '../application/use-cases/get-power-contracts.use-case.js';
import { GetPowerContractByIdUseCase } from '../application/use-cases/get-power-contract-by-id.use-case.js';
import { GetPowerContractHistoryUseCase } from '../application/use-cases/get-power-contract-history.use-case.js';
import { GetPowerContractHistoryDto } from '../application/dto/get-power-contract-history.dto.js';
import { GetPowerDashboardStatsUseCase } from '../application/use-cases/get-power-dashboard-stats.use-case.js';
import { GetPowerProjectTypesUseCase } from '../application/use-cases/get-power-project-types.use-case.js';
import { QueryPowerContractDto } from '../application/dto/query-power-contract.dto.js';

@ApiTags('Power Contracts (ສັນຍາຊື້-ຂາຍໄຟຟ້າ - ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ)')
@ApiBearerAuth()
@Controller('power-contracts')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.POWER_CONTRACTS)
export class PowerContractsController {
    constructor(
        private readonly createContractUseCase: CreatePowerContractUseCase,
        private readonly updateContractUseCase: UpdatePowerContractUseCase,
        private readonly deleteContractUseCase: DeletePowerContractUseCase,
        private readonly getContractsUseCase: GetPowerContractsUseCase,
        private readonly getContractByIdUseCase: GetPowerContractByIdUseCase,
        private readonly getContractHistoryUseCase: GetPowerContractHistoryUseCase,
        private readonly getDashboardStatsUseCase: GetPowerDashboardStatsUseCase,
        private readonly getProjectTypesUseCase: GetPowerProjectTypesUseCase,
    ) { }

    @ApiOperation({ summary: 'ສະຖິຕິ Dashboard ຂອງສັນຍາຊື້-ຂາຍໄຟຟ້າ (ຍອດລວມ, ແຍກຕາມສະຖານະ, ປະເພດສັນຍາ, ກຳລັງຕິດຕັ້ງ MW, ປະເພດໂຄງການ)' })
    @Get('dashboard')
    async getDashboard(@CurrentUser() user: any) {
        return this.getDashboardStatsUseCase.execute(user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍການ 5 ປະເພດໂຄງການສັນຍາຊື້ໄຟຟ້າ (ນ້ຳຕົກ, ແສງຕາເວັນ, ລົມ, ຄວາມຮ້ອນ, ຊີວະມວນ)' })
    @Get('project-types')
    async getProjectTypes() {
        return this.getProjectTypesUseCase.execute();
    }

    @ApiOperation({ summary: 'ດຶງລາຍການສັນຍາຊື້-ຂາຍໄຟຟ້າທັງໝົດ ພ້ອມ Pagination ແລະ Filter' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'contractType', required: false, enum: PowerContractType })
    @ApiQuery({ name: 'status', required: false, enum: ContractStatus })
    @ApiQuery({ name: 'projectTypeOrCustomer', required: false, type: String })
    @Get()
    async getContracts(@Query() query: QueryPowerContractDto, @CurrentUser() user: any) {
        return this.getContractsUseCase.execute(query, user);
    }

    @ApiOperation({ summary: 'ດຶງປະຫວັດການແກ້ໄຂສັນຍາຊື້-ຂາຍໄຟຟ້າ (Audit Trail / Edit History)' })
    @Get(':id/history')
    async getContractHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: GetPowerContractHistoryDto,
        @CurrentUser() user: any,
    ) {
        return this.getContractHistoryUseCase.execute(id, query, user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍລະອຽດສັນຍາຊື້-ຂາຍໄຟຟ້າຕາມ ID' })
    @Get(':id')
    async getContractById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
        return this.getContractByIdUseCase.execute(id, user);
    }

    @ApiOperation({ summary: 'ສ້າງສັນຍາຊື້-ຂາຍໄຟຟ້າໃໝ່ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload)' })
    @Post()
    async createContract(
        @Body() dto: CreatePowerContractDto,
        @CurrentUser() user: any,
    ) {
        return this.createContractUseCase.execute(dto, user);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າ (Admin, Main User ຫຼື ຜູ້ມີສິດ canEdit)' })
    @Patch(':id')
    async updateContract(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePowerContractDto,
        @CurrentUser() user: any,
    ) {
        return this.updateContractUseCase.execute(id, dto, user);
    }

    @ApiOperation({ summary: 'ລົບສັນຍາຊື້-ຂາຍໄຟຟ້າ (Soft Delete) (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete(':id')
    async deleteContract(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteContractUseCase.execute(id, user);
    }
}

