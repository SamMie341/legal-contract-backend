import { Injectable, Inject } from '@nestjs/common';
import * as notificationRepositoryInterface from '../../domain/repositories/notification.repository.interface.js';

@Injectable()
export class GetNotificationsUseCase {
    constructor(
        @Inject(notificationRepositoryInterface.NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: notificationRepositoryInterface.INotificationRepository,
    ) { }

    async execute(userId: string, unreadOnly: boolean = true) {
        const notifications = unreadOnly
            ? await this.notificationRepository.getUnreadNotifications(userId)
            : await this.notificationRepository.getAllNotifications(userId);

        const unreadList = await this.notificationRepository.getUnreadNotifications(userId);

        return {
            message: 'ດຶງການແຈ້ງເຕືອນສຳເລັດ',
            unreadCount: unreadList.length,
            total: notifications.length,
            data: notifications,
        };
    }
}
