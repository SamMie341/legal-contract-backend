import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditAction, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { GetAuditLogsUseCase } from '../application/use-cases/get-audit-logs.use-case.js';

@ApiTags('Audit Logs (ປະຫວັດການດຳເນີນງານໃນລະບົບ)')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
    constructor(private readonly getAuditLogsUseCase: GetAuditLogsUseCase) { }

    @ApiOperation({ summary: 'ດຶງປະຫວັດ Audit Logs ທັງໝົດ ພ້ອມ Filter ຕາມ Contract, User, Action' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'contractId', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, enum: AuditAction })
    @Get()
    async findAll(@Query() query: any) {
        return this.getAuditLogsUseCase.execute(query);
    }
}
