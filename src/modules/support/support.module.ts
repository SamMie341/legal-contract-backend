import { Module } from '@nestjs/common';
import { SupportController } from './presentation/support.controller.js';

import { GetContactChannelsUseCase } from './application/use-cases/get-contact-channels.use-case.js';
import { CreateContactChannelUseCase } from './application/use-cases/create-contact-channel.use-case.js';
import { DeleteContactChannelUseCase } from './application/use-cases/delete-contact-channel.use-case.js';
import { CreateSupportTicketUseCase } from './application/use-cases/create-support-ticket.use-case.js';
import { GetSupportTicketsUseCase } from './application/use-cases/get-support-tickets.use-case.js';
import { GetSupportTicketByIdUseCase } from './application/use-cases/get-support-ticket-by-id.use-case.js';
import { UpdateSupportTicketUseCase } from './application/use-cases/update-support-ticket.use-case.js';

import { CONTACT_CHANNEL_REPOSITORY } from './domain/repositories/contact-channel.repository.interface.js';
import { ContactChannelRepository } from './infrastructure/repositories/contact-channel.repository.js';
import { SUPPORT_TICKET_REPOSITORY } from './domain/repositories/support-ticket.repository.interface.js';
import { SupportTicketRepository } from './infrastructure/repositories/support-ticket.repository.js';

@Module({
    controllers: [SupportController],
    providers: [
        GetContactChannelsUseCase,
        CreateContactChannelUseCase,
        DeleteContactChannelUseCase,
        CreateSupportTicketUseCase,
        GetSupportTicketsUseCase,
        GetSupportTicketByIdUseCase,
        UpdateSupportTicketUseCase,
        {
            provide: CONTACT_CHANNEL_REPOSITORY,
            useClass: ContactChannelRepository,
        },
        {
            provide: SUPPORT_TICKET_REPOSITORY,
            useClass: SupportTicketRepository,
        },
    ],
    exports: [CONTACT_CHANNEL_REPOSITORY, SUPPORT_TICKET_REPOSITORY],
})
export class SupportModule { }
