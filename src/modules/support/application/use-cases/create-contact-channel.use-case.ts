import { Injectable, Inject } from '@nestjs/common';
import * as contactChannelRepoInterface from '../../domain/repositories/contact-channel.repository.interface.js';
import { CreateContactChannelDto } from '../dto/create-contact-channel.dto.js';

@Injectable()
export class CreateContactChannelUseCase {
    constructor(
        @Inject(contactChannelRepoInterface.CONTACT_CHANNEL_REPOSITORY)
        private readonly contactChannelRepo: contactChannelRepoInterface.IContactChannelRepository,
    ) { }

    async execute(dto: CreateContactChannelDto) {
        const channel = await this.contactChannelRepo.create(dto);
        return {
            message: 'ເພີ່ມຊ່ອງທາງຕິດຕໍ່ສຳເລັດ',
            data: channel,
        };
    }
}
