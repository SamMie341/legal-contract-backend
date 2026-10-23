import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

import { CreateLegalCaseDto } from '../application/dto/create-legal-case.dto.js';
import { UpdateLegalCaseDto } from '../application/dto/update-legal-case.dto.js';
import { QueryLegalCaseDto } from '../application/dto/query-legal-case.dto.js';

import { CreateLegalCaseUseCase } from '../application/use-cases/create-legal-case.use-case.js';
import { UpdateLegalCaseUseCase } from '../application/use-cases/update-legal-case.use-case.js';
import { DeleteLegalCaseUseCase } from '../application/use-cases/delete-legal-case.use-case.js';
import { GetLegalCasesUseCase } from '../application/use-cases/get-legal-cases.use-case.js';
import { GetLegalCaseByIdUseCase } from '../application/use-cases/get-legal-case-by-id.use-case.js';
import { GetLegalCaseDashboardUseCase } from '../application/use-cases/get-legal-case-dashboard.use-case.js';

@ApiTags('Legal Cases (ລະບົບຄຸ້ມຄອງ ແລະ ຕິດຕາມຄະດີ / ຂໍ້ຂັດແຍ່ງ)')
@ApiBearerAuth()
@Controller('legal-cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalCasesController {
    constructor(
        private readonly createLegalCaseUseCase: CreateLegalCaseUseCase,
        private readonly updateLegalCaseUseCase: UpdateLegalCaseUseCase,
        private readonly deleteLegalCaseUseCase: DeleteLegalCaseUseCase,
        private readonly getLegalCasesUseCase: GetLegalCasesUseCase,
        private readonly getLegalCaseByIdUseCase: GetLegalCaseByIdUseCase,
        private readonly getLegalCaseDashboardUseCase: GetLegalCaseDashboardUseCase,
    ) { }

    @ApiOperation({
        summary:
            'ສະຖິຕິ Dashboard ຄະດີ (ຍອດລວມ, ກຳລັງດຳເນີນການ/ສຳເລັດ, ຍອດລວມການເງິນ LAK/USD, Donut Chart ສະຖານະ/ປະເພດ, Bar Chart ຕາມຝ່າຍ)',
    })
    @Get('dashboard')
    async getDashboard(@CurrentUser() user: any) {
        return this.getLegalCaseDashboardUseCase.execute(user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍການຄະດີທັງໝົດ ພ້ອມ Pagination, Search ແລະ Filter' })
    @Get()
    async findAll(
        @Query() query: QueryLegalCaseDto,
        @CurrentUser() user: any,
    ) {
        return this.getLegalCasesUseCase.execute(query, user);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນລາຍລະອຽດຄະດີຕາມ ID (UUID ຫຼື ລະຫັດຄະດີ caseCode) ພ້ອມໄຟລ໌ແນບ ແລະ ຂໍ້ມູນຝ່າຍ' })
    @Get(':id')
    async findById(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.getLegalCaseByIdUseCase.execute(id, user);
    }

    @ApiOperation({ summary: 'ສ້າງບັນທຶກຄະດີໃໝ່ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload)' })
    @Post()
    async create(
        @Body() dto: CreateLegalCaseDto,
        @CurrentUser() user: any,
    ) {
        return this.createLegalCaseUseCase.execute(dto, user);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນຄະດີ (Admin, Main User ຫຼື ຜູ້ມີສິດ canEdit)' })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateLegalCaseDto,
        @CurrentUser() user: any,
    ) {
        return this.updateLegalCaseUseCase.execute(id, dto, user);
    }

    @ApiOperation({ summary: 'ລົບຂໍ້ມູນຄະດີ (Soft Delete) (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteLegalCaseUseCase.execute(id, user);
    }
}
