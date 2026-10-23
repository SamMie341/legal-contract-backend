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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

import { CreateLegalDocumentDto } from '../application/dto/create-legal-document.dto.js';
import { UpdateLegalDocumentDto } from '../application/dto/update-legal-document.dto.js';
import { QueryLegalDocumentDto } from '../application/dto/query-legal-document.dto.js';

import { CreateLegalDocumentUseCase } from '../application/use-cases/create-legal-document.use-case.js';
import { UpdateLegalDocumentUseCase } from '../application/use-cases/update-legal-document.use-case.js';
import { DeleteLegalDocumentUseCase } from '../application/use-cases/delete-legal-document.use-case.js';
import { GetLegalDocumentsUseCase } from '../application/use-cases/get-legal-documents.use-case.js';
import { GetLegalDocumentByIdUseCase } from '../application/use-cases/get-legal-document-by-id.use-case.js';
import { GetLegalDocumentDashboardUseCase } from '../application/use-cases/get-legal-document-dashboard.use-case.js';

@ApiTags('Legal Documents (ລະບົບຄຸ້ມຄອງ ແລະ ຕິດຕາມນິຕິກຳ)')
@ApiBearerAuth()
@Controller('legal-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalDocumentsController {
    constructor(
        private readonly createLegalDocumentUseCase: CreateLegalDocumentUseCase,
        private readonly updateLegalDocumentUseCase: UpdateLegalDocumentUseCase,
        private readonly deleteLegalDocumentUseCase: DeleteLegalDocumentUseCase,
        private readonly getLegalDocumentsUseCase: GetLegalDocumentsUseCase,
        private readonly getLegalDocumentByIdUseCase: GetLegalDocumentByIdUseCase,
        private readonly getLegalDocumentDashboardUseCase: GetLegalDocumentDashboardUseCase,
    ) { }

    @ApiOperation({
        summary: 'ສະຖິຕິ Dashboard ນິຕິກຳ (ຍອດລວມ, ຍັງນຳໃຊ້/ຍົກເລີກ, Donut Chart ແຍກຕາມປະເພດ, Bar Chart ແຍກຕາມຝ່າຍ)',
    })
    @Get('dashboard')
    async getDashboard(@CurrentUser() user: any) {
        return this.getLegalDocumentDashboardUseCase.execute(user);
    }

    @ApiOperation({ summary: 'ດຶງລາຍການນິຕິກຳທັງໝົດ ພ້ອມ Pagination, Search ແລະ Filter' })
    @Get()
    async findAll(
        @Query() query: QueryLegalDocumentDto,
        @CurrentUser() user: any,
    ) {
        return this.getLegalDocumentsUseCase.execute(query, user);
    }

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນລາຍລະອຽດນິຕິກຳຕາມ ID ພ້ອມໄຟລ໌ແນບ ແລະ ຂໍ້ມູນຝ່າຍ' })
    @Get(':id')
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.getLegalDocumentByIdUseCase.execute(id, user);
    }

    @ApiOperation({ summary: 'ສ້າງນິຕິກຳໃໝ່ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload)' })
    @Post()
    async create(
        @Body() dto: CreateLegalDocumentDto,
        @CurrentUser() user: any,
    ) {
        return this.createLegalDocumentUseCase.execute(dto, user);
    }

    @ApiOperation({ summary: 'ແກ້ໄຂຂໍ້ມູນນິຕິກຳ (Admin, Main User ຫຼື ຜູ້ມີສິດ canEdit)' })
    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateLegalDocumentDto,
        @CurrentUser() user: any,
    ) {
        return this.updateLegalDocumentUseCase.execute(id, dto, user);
    }

    @ApiOperation({ summary: 'ລົບນິຕິກຳ (Soft Delete) (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete(':id')
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteLegalDocumentUseCase.execute(id, user);
    }
}
