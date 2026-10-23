import { Controller, Post, Get, Patch, Delete, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { CreateContractUseCase } from '../application/use-cases/create-contract.use-case.js';
import { CreateContractDto } from '../application/dto/create-contract.dto.js';
import { UpdateContractUseCase } from '../application/use-cases/update-contract.use-case.js';
import { UpdateContractDto } from '../application/dto/update-contract.dto.js';
import { DeleteContractUseCase } from '../application/use-cases/delete-contract.use-case.js';
import { GetContractsUseCase } from '../application/use-cases/get-contracts.use-case.js';
import { GetContractByIdUseCase } from '../application/use-cases/get-contract-by-id.use-case.js';
import { GetContractHistoryUseCase } from '../application/use-cases/get-contract-history.use-case.js';
import { GetContractHistoryDto } from '../application/dto/get-contract-history.dto.js';
import { GetDashboardStatsUseCase } from '../application/use-cases/get-dashboard-stats.use-case.js';

@ApiTags('Contracts (ການຈັດການສັນຍາ)')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
    constructor(
        private readonly createContractUseCase: CreateContractUseCase,
        private readonly updateContractUseCase: UpdateContractUseCase,
        private readonly deleteContractUseCase: DeleteContractUseCase,
        private readonly getContractsUseCase: GetContractsUseCase,
        private readonly getContractByIdUseCase: GetContractByIdUseCase,
        private readonly getContractHistoryUseCase: GetContractHistoryUseCase,
        private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    ) { }

    @ApiOperation({ summary: 'ສະຖິຕິ Dashboard ຂອງສັນຍາ (ຍອດລວມ, ແຍກຕາມສະຖານະ, ສະກຸນເງິນ, ປະເພດສັນຍາ)' })
    @Get('dashboard')
    async getDashboard(@CurrentUser() user: any) {
        return this.getDashboardStatsUseCase.execute(user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍການສັນຍາທັງໝົດ ພ້ອມ Pagination ແລະ Filter' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'contractTypeId', required: false, type: Number })
    @Get()
    async getContracts(@Query() query: any, @CurrentUser() user: any) {
        return this.getContractsUseCase.execute(query, user);
    }

    @ApiOperation({ summary: 'ດຶງປະຫວັດການແກ້ໄຂສັນຍາ (Audit Trail / Edit History ພ້ອມລາຍລະອຽດການປ່ຽນແປງ)' })
    @Get(':id/history')
    async getContractHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: GetContractHistoryDto,
        @CurrentUser() user: any,
    ) {
        return this.getContractHistoryUseCase.execute(id, query, user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍລະອຽດສັນຍາຕາມ ID' })
    @Get(':id')
    async getContractById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
        return this.getContractByIdUseCase.execute(id, user);
    }

    @ApiOperation({ summary: 'ສ້າງສັນຍາໃໝ່ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload)' })
    @Post()
    async createContract(
        @Body() dto: CreateContractDto,
        @CurrentUser() user: any,
    ) {
        return this.createContractUseCase.execute(dto, user);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນສັນຍາ (Admin, Main User ຫຼື ຜູ້ມີສິດ canEdit)' })
    @Patch(':id')
    async updateContract(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateContractDto,
        @CurrentUser() user: any,
    ) {
        return this.updateContractUseCase.execute(id, dto, user);
    }

    @ApiOperation({ summary: 'ລົບສັນຍາ (Soft Delete) (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete(':id')
    async deleteContract(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteContractUseCase.execute(id, user);
    }
}
