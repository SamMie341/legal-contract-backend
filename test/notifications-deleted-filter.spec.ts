import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationRepository } from '../src/modules/contracts/infrastructure/repositories/notification.repository.js';
import { PowerContractNotificationRepository } from '../src/modules/power-contracts/infrastructure/repositories/power-contract-notification.repository.js';

describe('Notifications Soft-Deleted Filter', () => {
    let notiRepo: NotificationRepository;
    let powerNotiRepo: PowerContractNotificationRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            contractNotification: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
                deleteMany: vi.fn(),
            },
            powerContractNotification: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
                deleteMany: vi.fn(),
            },
        };
        notiRepo = new NotificationRepository(mockPrisma as any);
        powerNotiRepo = new PowerContractNotificationRepository(mockPrisma as any);
    });

    it('getUnreadNotifications should filter contract with deletedAt: null', async () => {
        let capturedWhere: any = null;
        mockPrisma.contractNotification.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await notiRepo.getUnreadNotifications('user-1');

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.contract).toEqual({ deletedAt: null });
        expect(capturedWhere.isRead).toBe(false);
    });

    it('getAllNotifications should filter contract with deletedAt: null', async () => {
        let capturedWhere: any = null;
        mockPrisma.contractNotification.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await notiRepo.getAllNotifications('user-1');

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.contract).toEqual({ deletedAt: null });
    });

    it('powerNotiRepo.getUnreadNotifications should filter powerContract with deletedAt: null', async () => {
        let capturedWhere: any = null;
        mockPrisma.powerContractNotification.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await powerNotiRepo.getUnreadNotifications('user-1');

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.powerContract).toEqual({ deletedAt: null });
        expect(capturedWhere.isRead).toBe(false);
    });

    it('powerNotiRepo.getAllNotifications should filter powerContract with deletedAt: null', async () => {
        let capturedWhere: any = null;
        mockPrisma.powerContractNotification.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await powerNotiRepo.getAllNotifications('user-1');

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.powerContract).toEqual({ deletedAt: null });
    });
});
