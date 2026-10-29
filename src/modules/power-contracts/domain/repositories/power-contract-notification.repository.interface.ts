import { PowerContractNotification } from '@prisma/client';

export const POWER_CONTRACT_NOTIFICATION_REPOSITORY = Symbol('POWER_CONTRACT_NOTIFICATION_REPOSITORY');

export interface IPowerContractNotificationRepository {
    getUnreadNotifications(userId?: string): Promise<PowerContractNotification[]>;
    getAllNotifications(userId?: string, limit?: number): Promise<PowerContractNotification[]>;
    markAsRead(notificationId: string): Promise<PowerContractNotification>;
    markAllAsRead(userId?: string): Promise<{ count: number }>;
}

