import { Injectable, Inject } from '@nestjs/common';
import * as powerContractNotificationRepositoryInterface from '../../domain/repositories/power-contract-notification.repository.interface.js';

@Injectable()
export class MarkPowerNotificationReadUseCase {
    constructor(
        @Inject(powerContractNotificationRepositoryInterface.POWER_CONTRACT_NOTIFICATION_REPOSITORY)
        private readonly notificationRepo: powerContractNotificationRepositoryInterface.IPowerContractNotificationRepository,
    ) { }

    async execute(notificationId?: string, userId?: string) {
        if (notificationId) {
            const data = await this.notificationRepo.markAsRead(notificationId);
            return {
                message: 'ໝາຍການແຈ້ງເຕືອນວ່າອ່ານແລ້ວສຳເລັດ',
                data,
            };
        } else {
            const result = await this.notificationRepo.markAllAsRead(userId);
            return {
                message: 'ໝາຍການແຈ້ງເຕືອນທັງໝົດວ່າອ່ານແລ້ວສຳເລັດ',
                data: result,
            };
        }
    }
}

