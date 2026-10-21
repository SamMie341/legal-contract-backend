import { Injectable, Inject } from '@nestjs/common';
import * as supportTicketRepoInterface from '../../domain/repositories/support-ticket.repository.interface.js';
import { TicketStatus, UserRole } from '@prisma/client';

@Injectable()
export class GetSupportTicketsUseCase {
    constructor(
        @Inject(supportTicketRepoInterface.SUPPORT_TICKET_REPOSITORY)
        private readonly ticketRepo: supportTicketRepoInterface.ISupportTicketRepository,
    ) { }

    async execute(
        userId: string,
        userRole: UserRole,
        query: { page?: number; limit?: number; status?: TicketStatus },
    ) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        // ຖ້າບໍ່ແມ່ນ Admin ຈະເຫັນສະເພາະ Ticket ຂອງຕົນເອງ
        const filterUserId = userRole === UserRole.ADMIN ? undefined : userId;

        const result = await this.ticketRepo.findAll({
            skip,
            take: limit,
            userId: filterUserId,
            status: query.status,
        });

        return {
            message: 'ດຶງລາຍການແຈ້ງບັນຫາສຳເລັດ',
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
            data: result.data,
        };
    }
}
