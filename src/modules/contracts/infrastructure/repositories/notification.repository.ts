import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface.js';
import { ContractNotification } from '@prisma/client';

@Injectable()
export class NotificationRepository implements INotificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async getUnreadNotifications(userId?: string): Promise<ContractNotification[]> {
        return this.prisma.contractNotification.findMany({
            where: {
                isRead: false,
                OR: [
                    { userId: null },
                    { userId: userId }
                ]
            },
            orderBy: { notifiedDate: 'desc' },
            include: {
                contract: { select: { contractNumber: true, title: true, expirationDate: true } }
            }
        });
    }

    async getAllNotifications(userId?: string, limit: number = 50): Promise<ContractNotification[]> {
        return this.prisma.contractNotification.findMany({
            where: {
                OR: [
                    { userId: null },
                    { userId: userId }
                ]
            },
            take: limit,
            orderBy: { notifiedDate: 'desc' },
            include: {
                contract: { select: { contractNumber: true, title: true, expirationDate: true } }
            }
        });
    }

    async markAsRead(notificationId: string): Promise<ContractNotification> {
        const noti = await this.prisma.contractNotification.findUnique({
            where: { id: notificationId }
        });

        if (!noti) {
            throw new NotFoundException('ບໍ່ພົບການແຈ້ງເຕືອນນີ້ (Notification not found)');
        }

        return this.prisma.contractNotification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    async markAllAsRead(userId?: string): Promise<{ count: number }> {
        const result = await this.prisma.contractNotification.updateMany({
            where: {
                isRead: false,
                OR: [
                    { userId: null },
                    { userId: userId }
                ]
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        return { count: result.count };
    }
}
