import { Injectable, Inject } from '@nestjs/common';
import * as supportTicketRepoInterface from '../../domain/repositories/support-ticket.repository.interface.js';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto.js';

@Injectable()
export class CreateSupportTicketUseCase {
    constructor(
        @Inject(supportTicketRepoInterface.SUPPORT_TICKET_REPOSITORY)
        private readonly ticketRepo: supportTicketRepoInterface.ISupportTicketRepository,
    ) { }

    async execute(dto: CreateSupportTicketDto, userId: string) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const totalCount = await this.ticketRepo.countTotal();
        const ticketNumber = `TKT-${yearMonth}-${String(totalCount + 1).padStart(4, '0')}`;

        const ticket = await this.ticketRepo.create(dto, ticketNumber, userId);

        return {
            message: 'ສົ່ງເລື່ອງແຈ້ງບັນຫາ/ປັບປຸງລະບົບສຳເລັດ',
            data: ticket,
        };
    }
}
