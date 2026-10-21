import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IContactChannelRepository } from '../../domain/repositories/contact-channel.repository.interface.js';
import { CreateContactChannelDto } from '../../application/dto/create-contact-channel.dto.js';
import { SystemContactChannel } from '@prisma/client';

@Injectable()
export class ContactChannelRepository implements IContactChannelRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAllActive(): Promise<SystemContactChannel[]> {
        return this.prisma.systemContactChannel.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findById(id: number): Promise<SystemContactChannel | null> {
        return this.prisma.systemContactChannel.findUnique({ where: { id } });
    }

    async create(dto: CreateContactChannelDto): Promise<SystemContactChannel> {
        return this.prisma.systemContactChannel.create({
            data: {
                channelName: dto.channelName,
                contactInfo: dto.contactInfo,
                description: dto.description,
                sortOrder: dto.sortOrder || 0,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.systemContactChannel.delete({ where: { id } });
    }
}
