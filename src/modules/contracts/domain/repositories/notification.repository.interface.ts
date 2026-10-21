import { ContractNotification } from '@prisma/client';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
    getUnreadNotifications(userId?: string): Promise<ContractNotification[]>;
    getAllNotifications(userId?: string, limit?: number): Promise<ContractNotification[]>;
    markAsRead(notificationId: string): Promise<ContractNotification>;
    markAllAsRead(userId?: string): Promise<{ count: number }>;
}
