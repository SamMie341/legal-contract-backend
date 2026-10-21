import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { ISupportTicketRepository } from '../../domain/repositories/support-ticket.repository.interface.js';
import { CreateSupportTicketDto } from '../../application/dto/create-support-ticket.dto.js';
import { UpdateSupportTicketDto } from '../../application/dto/update-support-ticket.dto.js';
import { SupportTicket, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportTicketRepository implements ISupportTicketRepository {
    constructor(private readonly prisma: PrismaService) { }

    async countTotal(): Promise<number> {
        return this.prisma.supportTicket.count();
    }

    async create(
        dto: CreateSupportTicketDto,
        ticketNumber: string,
        userId: string,
    ): Promise<SupportTicket> {
        return this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                subject: dto.subject,
                description: dto.description,
                attachmentUrl: dto.attachmentUrl,
                priority: dto.priority,
                reportedById: userId,
            },
            include: {
                reportedBy: { select: { fullName: true, department: true } },
            },
        });
    }

    async findAll(params: {
        skip: number;
        take: number;
        userId?: string;
        status?: TicketStatus;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, userId, status } = params;

        const whereCondition: any = {};
        if (userId) {
            whereCondition.reportedById = userId;
        }
        if (status) {
            whereCondition.status = status;
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.supportTicket.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    reportedBy: { select: { fullName: true, department: true, employeeCode: true } },
                    assignedTo: { select: { fullName: true } },
                },
            }),
            this.prisma.supportTicket.count({ where: whereCondition }),
        ]);

        return { data, total };
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                reportedBy: { select: { fullName: true, department: true, email: true, phone: true } },
                assignedTo: { select: { fullName: true, email: true } },
            },
        });
    }

    async update(
        id: string,
        dto: UpdateSupportTicketDto,
        resolvedAt?: Date,
    ): Promise<SupportTicket> {
        const dataToUpdate: any = { ...dto };
        if (resolvedAt) {
            dataToUpdate.resolvedAt = resolvedAt;
        }

        return this.prisma.supportTicket.update({
            where: { id },
            data: dataToUpdate,
            include: {
                reportedBy: { select: { fullName: true, department: true } },
                assignedTo: { select: { fullName: true } },
            },
        });
    }
}
