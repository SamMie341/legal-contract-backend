import { Injectable, Inject } from '@nestjs/common';
import * as powerContractNotificationRepositoryInterface from '../../domain/repositories/power-contract-notification.repository.interface.js';

@Injectable()
export class GetPowerNotificationsUseCase {
    constructor(
        @Inject(powerContractNotificationRepositoryInterface.POWER_CONTRACT_NOTIFICATION_REPOSITORY)
        private readonly notificationRepo: powerContractNotificationRepositoryInterface.IPowerContractNotificationRepository,
    ) { }

    async execute(userId?: string, unreadOnly: boolean = false) {
        const data = unreadOnly
            ? await this.notificationRepo.getUnreadNotifications(userId)
            : await this.notificationRepo.getAllNotifications(userId);

        return {
            message: 'ດຶງລາຍການແຈ້ງເຕືອນສັນຍາຊື້-ຂາຍໄຟຟ້າສຳເລັດ',
            data,
        };
    }
}

