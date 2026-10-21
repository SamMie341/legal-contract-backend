import { Injectable, Inject } from '@nestjs/common';
import * as contactChannelRepoInterface from '../../domain/repositories/contact-channel.repository.interface.js';

@Injectable()
export class GetContactChannelsUseCase {
    constructor(
        @Inject(contactChannelRepoInterface.CONTACT_CHANNEL_REPOSITORY)
        private readonly contactChannelRepo: contactChannelRepoInterface.IContactChannelRepository,
    ) { }

    async execute() {
        const channels = await this.contactChannelRepo.findAllActive();
        return {
            message: 'ດຶງຂໍ້ມູນຊ່ອງທາງຕິດຕໍ່ສຳເລັດ',
            data: channels,
        };
    }
}
