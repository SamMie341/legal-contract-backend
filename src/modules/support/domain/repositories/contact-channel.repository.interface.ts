import { SystemContactChannel } from '@prisma/client';
import { CreateContactChannelDto } from '../../application/dto/create-contact-channel.dto.js';

export const CONTACT_CHANNEL_REPOSITORY = Symbol('CONTACT_CHANNEL_REPOSITORY');

export interface IContactChannelRepository {
    findAllActive(): Promise<SystemContactChannel[]>;
    findById(id: number): Promise<SystemContactChannel | null>;
    create(dto: CreateContactChannelDto): Promise<SystemContactChannel>;
    delete(id: number): Promise<void>;
}
