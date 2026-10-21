import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as supportTicketRepoInterface from '../../domain/repositories/support-ticket.repository.interface.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class GetSupportTicketByIdUseCase {
    constructor(
        @Inject(supportTicketRepoInterface.SUPPORT_TICKET_REPOSITORY)
        private readonly ticketRepo: supportTicketRepoInterface.ISupportTicketRepository,
    ) { }

    async execute(id: string, userId: string, userRole: UserRole) {
        const ticket = await this.ticketRepo.findById(id);

        if (!ticket) {
            throw new NotFoundException('ບໍ່ພົບລາຍການແຈ້ງບັນຫານີ້ (Ticket not found)');
        }

        if (userRole !== UserRole.ADMIN && ticket.reportedById !== userId) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເບິ່ງລາຍການນີ້ (Forbidden)');
        }

        return {
            message: 'ດຶງຂໍ້ມູນ Ticket ສຳເລັດ',
            data: ticket,
        };
    }
}
