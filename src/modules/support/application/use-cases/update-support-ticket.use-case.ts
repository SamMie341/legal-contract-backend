import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as supportTicketRepoInterface from '../../domain/repositories/support-ticket.repository.interface.js';
import { UpdateSupportTicketDto } from '../dto/update-support-ticket.dto.js';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class UpdateSupportTicketUseCase {
    constructor(
        @Inject(supportTicketRepoInterface.SUPPORT_TICKET_REPOSITORY)
        private readonly ticketRepo: supportTicketRepoInterface.ISupportTicketRepository,
    ) { }

    async execute(id: string, dto: UpdateSupportTicketDto) {
        const ticket = await this.ticketRepo.findById(id);

        if (!ticket) {
            throw new NotFoundException('ບໍ່ພົບລາຍການແຈ້ງບັນຫານີ້');
        }

        let resolvedAt: Date | undefined;
        if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
            resolvedAt = new Date();
        }

        const updated = await this.ticketRepo.update(id, dto, resolvedAt);

        return {
            message: 'ອັບເດດສະຖານະ Ticket ສຳເລັດ',
            data: updated,
        };
    }
}
