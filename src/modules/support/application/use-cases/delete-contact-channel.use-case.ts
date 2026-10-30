import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as contactChannelRepoInterface from '../../domain/repositories/contact-channel.repository.interface.js';

@Injectable()
export class DeleteContactChannelUseCase {
    constructor(
        @Inject(contactChannelRepoInterface.CONTACT_CHANNEL_REPOSITORY)
        private readonly contactChannelRepo: contactChannelRepoInterface.IContactChannelRepository,
    ) { }

    async execute(id: number) {
        const existing = await this.contactChannelRepo.findById(id);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຊ່ອງທາງຕິດຕໍ່ນີ້');
        }

        await this.contactChannelRepo.delete(id);
        return { message: 'ລົບຊ່ອງທາງຕິດຕໍ່ສຳເລັດ' };
    }
}
