import { SupportTicket, TicketStatus } from '@prisma/client';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto.js';
import { UpdateSupportTicketDto } from '../../application/dto/update-support-ticket.dto.js';

export const SUPPORT_TICKET_REPOSITORY = Symbol('SUPPORT_TICKET_REPOSITORY');

export interface ISupportTicketRepository {
    countTotal(): Promise<number>;
    create(dto: CreateSupportTicketDto, ticketNumber: string, userId: string): Promise<SupportTicket>;
    findAll(params: {
        skip: number;
        take: number;
        userId?: string;
        status?: TicketStatus;
    }): Promise<{ data: any[]; total: number }>;
    findById(id: string): Promise<any | null>;
    update(id: string, dto: UpdateSupportTicketDto, resolvedAt?: Date): Promise<SupportTicket>;
}
