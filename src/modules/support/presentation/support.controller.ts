import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    NotFoundException,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, isAbsolute, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
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

// กำหนดโฟลเดอร์เก็บไฟล์รูปภาพแจ้งปัญหาไว้นอกโปรเจกต์ (../uploads/tickets หรือตามค่า TICKET_UPLOAD_DIR ใน .env)
const ticketUploadDir = resolve(process.cwd(), process.env.TICKET_UPLOAD_DIR || '../uploads/tickets');
if (!existsSync(ticketUploadDir)) {
    mkdirSync(ticketUploadDir, { recursive: true });
}

const ticketStorage = diskStorage({
    destination: ticketUploadDir,
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        cb(null, `ticket-${uniqueSuffix}${extname(file.originalname)}`);
    },
});

const ticketFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedExtensions = /\.(png|jpg|jpeg|gif|webp|pdf)$/i;
    const allowedMimeTypes = /^(image\/(png|jpeg|jpg|gif|webp)|application\/pdf)$/i;

    if (!file.originalname.match(allowedExtensions) || !file.mimetype.match(allowedMimeTypes)) {
        return cb(
            new BadRequestException(
                'ອະນຸຍາດສະເພາະໄຟລ໌ຮູບພາບ ຫຼື PDF ເທົ່ານັ້ນ (Allowed: PNG, JPG, JPEG, GIF, WEBP, PDF)',
            ),
            false,
        );
    }
    cb(null, true);
};

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

    @ApiOperation({ summary: 'ແຈ້ງບັນຫາ ຫຼື ສົ່ງຄຳຂໍປັບປຸງລະບົບ ພ້ອມແນບຮູບພາບ (ທຸກຄົນສາມາດສົ່ງໄດ້)' })
    @ApiConsumes('multipart/form-data', 'application/json')
    @Post('tickets')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: ticketStorage,
            fileFilter: ticketFileFilter,
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        }),
    )
    async createTicket(
        @Body() dto: CreateSupportTicketDto,
        @UploadedFile() file: Express.Multer.File | undefined,
        @CurrentUser() user: any,
    ) {
        if (file) {
            dto.attachmentUrl = file.path;
        }
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

    @ApiOperation({ summary: 'ເປີດເບິ່ງໄຟລ໌ຮູບພາບປະກອບຂອງ Ticket' })
    @Get('tickets/:id/attachment')
    async getTicketAttachment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const result = await this.getSupportTicketByIdUseCase.execute(id, user.userId, user.role);
        const attachmentUrl = result.data.attachmentUrl;

        if (!attachmentUrl) {
            throw new NotFoundException('ລາຍການນີ້ບໍ່ມີໄຟລ໌ແນບ (No attachment for this ticket)');
        }

        const filePath = isAbsolute(attachmentUrl)
            ? attachmentUrl
            : resolve(process.cwd(), attachmentUrl);

        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on server' });
        }

        const ext = extname(filePath).toLowerCase();
        const mimeMap: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        };

        return res.sendFile(filePath, {
            headers: {
                'Content-Type': mimeMap[ext] || 'application/octet-stream',
                'Content-Disposition': 'inline',
            },
        }, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
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
