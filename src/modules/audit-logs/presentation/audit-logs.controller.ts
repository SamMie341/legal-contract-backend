import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditAction, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { GetAuditLogsUseCase } from '../application/use-cases/get-audit-logs.use-case.js';

@ApiTags('Audit Logs (ປະຫວັດການດຳເນີນງານໃນລະບົບ)')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.AUDIT_LOGS)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
    constructor(private readonly getAuditLogsUseCase: GetAuditLogsUseCase) { }

    @ApiOperation({ summary: 'ສະຖິຕິພາບລວມ Audit Logs (ຈຳນວນລວມ, ຄວາມປອດໄພ, ສັນຍາ, ນິຕິກຳ, ໄຟລ໌)' })
    @Get('stats')
    async getStats() {
        return this.getAuditLogsUseCase.getStats();
    }

    @ApiOperation({ summary: 'ດຶງປະຫວັດ Audit Logs ທັງໝົດ ພ້ອມ Filter ຕາມ Contract, User, Action, Search, Date Range' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'contractId', required: false, type: String })
    @ApiQuery({ name: 'powerContractId', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: String, description: 'ID ຂອງຜູ້ດຳເນີນການ (Operator / Actor)' })
    @ApiQuery({ name: 'targetUserId', required: false, type: String, description: 'ID ຂອງຜູ້ໃຊ້ທີ່ຖືກແກ້ໄຂ (Target User)' })
    @ApiQuery({ name: 'action', required: false, enum: AuditAction })
    @ApiQuery({ name: 'category', required: false, type: String })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @Get()
    async findAll(@Query() query: any) {
        return this.getAuditLogsUseCase.execute(query);
    }
}
