import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';

import { CreateContactChannelDto } from '../application/dto/create-contact-channel.dto.js';
import { CreateSupportTicketDto } from '../application/dto/create-support-ticket.dto.js';
import { UpdateSupportTicketDto } from '../application/dto/update-support-ticket.dto.js';

import { GetContactChannelsUseCase } from '../application/use-cases/get-contact-channels.use-case.js';
import { CreateContactChannelUseCase } from '../application/use-cases/create-contact-channel.use-case.js';
import { DeleteContactChannelUseCase } from '../application/use-cases/delete-contact-channel.use-case.js';
import { CreateSupportTicketUseCase } from '../application/use-cases/create-support-ticket.use-case.js';
import { GetSupportTicketsUseCase } from '../application/use-cases/get-support-tickets.use-case.js';
import { GetSupportTicketByIdUseCase } from '../application/use-cases/get-support-ticket-by-id.use-case.js';
import { UpdateSupportTicketUseCase } from '../application/use-cases/update-support-ticket.use-case.js';

@ApiTags('Support & Contacts (ຊ່ອງທາງຕິດຕໍ່ ແລະ ແຈ້ງບັນຫາ - ຂໍ້ 6)')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
    constructor(
        private readonly getContactChannelsUseCase: GetContactChannelsUseCase,
        private readonly createContactChannelUseCase: CreateContactChannelUseCase,
        private readonly deleteContactChannelUseCase: DeleteContactChannelUseCase,
        private readonly createSupportTicketUseCase: CreateSupportTicketUseCase,
        private readonly getSupportTicketsUseCase: GetSupportTicketsUseCase,
        private readonly getSupportTicketByIdUseCase: GetSupportTicketByIdUseCase,
        private readonly updateSupportTicketUseCase: UpdateSupportTicketUseCase,
    ) { }

    // ==========================================
    // 1. CONTACT CHANNELS (ທຸກຄົນທີ່ Login ເບິ່ງໄດ້)
    // ==========================================

    @ApiOperation({ summary: 'ດຶງຂໍ້ມູນຊ່ອງທາງຕິດຕໍ່ຜູ້ດູແລລະບົບທັງໝົດ (ຂໍ້ 6)' })
    @Get('contacts')
    async getContactChannels() {
        return this.getContactChannelsUseCase.execute();
    }

    @ApiOperation({ summary: 'ເພີ່ມຊ່ອງທາງຕິດຕໍ່ໃໝ່ (Admin Only)' })
    @Post('contacts')
    @Roles(UserRole.ADMIN)
    async createContactChannel(@Body() dto: CreateContactChannelDto) {
        return this.createContactChannelUseCase.execute(dto);
    }

    @ApiOperation({ summary: 'ລົບຊ່ອງທາງຕິດຕໍ່ (Admin Only)' })
    @Delete('contacts/:id')
    @Roles(UserRole.ADMIN)
    async deleteContactChannel(@Param('id', ParseIntPipe) id: number) {
        return this.deleteContactChannelUseCase.execute(id);
    }

    // ==========================================
    // 2. SUPPORT TICKETS
    // ==========================================

    @ApiOperation({ summary: 'ແຈ້ງບັນຫາ ຫຼື ສົ່ງຄຳຂໍປັບປຸງລະບົບ (ທຸກຄົນສາມາດສົ່ງໄດ້)' })
    @Post('tickets')
    async createTicket(
        @Body() dto: CreateSupportTicketDto,
        @CurrentUser() user: any,
    ) {
        return this.createSupportTicketUseCase.execute(dto, user.userId);
    }

    @ApiOperation({ summary: 'ດຶງລາຍການແຈ້ງບັນຫາ (User ທຳມະດາຈະເຫັນຂອງຕົນເອງ, Admin ເຫັນທັງໝົດ)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
    @Get('tickets')
    async getTickets(
        @CurrentUser() user: any,
        @Query() query: any,
    ) {
        return this.getSupportTicketsUseCase.execute(user.userId, user.role, query);
    }

    @ApiOperation({ summary: 'ດຶງລາຍລະອຽດ Ticket ຕາມ ID' })
    @Get('tickets/:id')
    async getTicketById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.getSupportTicketByIdUseCase.execute(id, user.userId, user.role);
    }

    @ApiOperation({ summary: 'ອັບເດດສະຖານະ Ticket (Admin Only)' })
    @Patch('tickets/:id')
    @Roles(UserRole.ADMIN)
    async updateTicket(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSupportTicketDto,
    ) {
        return this.updateSupportTicketUseCase.execute(id, dto);
    }
}
