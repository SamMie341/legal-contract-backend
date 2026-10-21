import { Injectable, Inject } from '@nestjs/common';
import * as notificationRepositoryInterface from '../../domain/repositories/notification.repository.interface.js';

@Injectable()
export class MarkNotificationReadUseCase {
    constructor(
        @Inject(notificationRepositoryInterface.NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: notificationRepositoryInterface.INotificationRepository,
    ) { }

    async execute(notificationId: string) {
        const updatedNoti = await this.notificationRepository.markAsRead(notificationId);

        return {
            message: 'ໝາຍວ່າອ່ານແລ້ວ (Marked as read)',
            data: updatedNoti,
        };
    }

    async executeAll(userId: string) {
        const result = await this.notificationRepository.markAllAsRead(userId);

        return {
            message: 'ໝາຍການແຈ້ງເຕືອນທັງໝົດວ່າອ່ານແລ້ວ',
            count: result.count,
        };
    }
}
