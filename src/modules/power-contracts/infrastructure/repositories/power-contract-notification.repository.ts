import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IPowerContractNotificationRepository } from '../../domain/repositories/power-contract-notification.repository.interface.js';
import { PowerContractNotification } from '@prisma/client';

@Injectable()
export class PowerContractNotificationRepository implements IPowerContractNotificationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async getUnreadNotifications(userId?: string): Promise<PowerContractNotification[]> {
        return this.prisma.powerContractNotification.findMany({
            where: {
                isRead: false,
                OR: [{ userId: null }, { userId: userId }],
            },
            orderBy: { notifiedDate: 'desc' },
            include: {
                powerContract: {
                    select: {
                        id: true,
                        contractNumber: true,
                        projectName: true,
                        contractType: true,
                        expirationDate: true,
                    },
                },
            },
        });
    }

    async getAllNotifications(userId?: string, limit: number = 50): Promise<PowerContractNotification[]> {
        return this.prisma.powerContractNotification.findMany({
            where: {
                OR: [{ userId: null }, { userId: userId }],
            },
            take: limit,
            orderBy: { notifiedDate: 'desc' },
            include: {
                powerContract: {
                    select: {
                        id: true,
                        contractNumber: true,
                        projectName: true,
                        contractType: true,
                        expirationDate: true,
                    },
                },
            },
        });
    }

    async markAsRead(notificationId: string): Promise<PowerContractNotification> {
        const noti = await this.prisma.powerContractNotification.findUnique({
            where: { id: notificationId },
        });

        if (!noti) {
            throw new NotFoundException('ບໍ່ພົບການແຈ້ງເຕືອນນີ້ (Notification not found)');
        }

        return this.prisma.powerContractNotification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId?: string): Promise<{ count: number }> {
        const result = await this.prisma.powerContractNotification.updateMany({
            where: {
                isRead: false,
                OR: [{ userId: null }, { userId: userId }],
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { count: result.count };
    }
}

