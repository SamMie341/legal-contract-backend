import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

@Injectable()
export class TokenVersionService {
    // In-memory cache for user token versions (userId -> tokenVersion) for ultra-fast lookup (0 DB queries)
    private readonly versions = new Map<string, number>();

    constructor(private readonly prisma: PrismaService) { }

    /**
     * ດຶງຄ່າ tokenVersion ປັດຈຸບັນຂອງ User
     * ຈະອ່ານຈາກ Memory Cache ກ່ອນສະເໝີ (ຄວາມໄວລະດັບ Nanosecond).
     * ຫາກບໍ່ມີໃນ Cache ຈຶ່ງ Query ຈາກ Database ແລ້ວບັນທຶກລົງ Cache.
     */
    async getVersion(userId: string): Promise<number> {
        const cached = this.versions.get(userId);
        if (cached !== undefined) {
            return cached;
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tokenVersion: true },
        });

        const version = user?.tokenVersion ?? 1;
        this.versions.set(userId, version);
        return version;
    }

    /**
     * ຍົກເລີກສິດ (Invalidate) Token ຂອງ User ຄົນດຽວທັນທີ (Increment tokenVersion ໃນ DB ແລະ Cache)
     */
    async invalidateUser(userId: string): Promise<number> {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: { tokenVersion: { increment: 1 } },
                select: { tokenVersion: true },
            });
            this.versions.set(userId, user.tokenVersion);
            return user.tokenVersion;
        } catch {
            const current = (this.versions.get(userId) || 1) + 1;
            this.versions.set(userId, current);
            return current;
        }
    }

    /**
     * ຍົກເລີກສິດ (Invalidate) Token ຂອງທຸກໆ User ທີ່ຖື Role ນີ້ (ເມື່ອມີການແກ້ໄຂສິດ Matrix ຂອງ Role)
     */
    async invalidateRole(roleId: string): Promise<void> {
        try {
            await this.prisma.user.updateMany({
                where: { roleId, deletedAt: null },
                data: { tokenVersion: { increment: 1 } },
            });
        } catch { }

        // Clear ທຸກ Cache ເພື່ອບັງຄັບໃຫ້ Reload version ໃໝ່
        this.versions.clear();
    }

    /**
     * ກວດສອບວ່າ Token ທີ່ສົ່ງມານັ້ນຍັງຖືກຕ້ອງຕາມ Version ຫຼ້າສຸດຫຼືບໍ່
     */
    async isValid(userId: string, tokenVersion?: number): Promise<boolean> {
        if (tokenVersion === undefined || tokenVersion === null) {
            return false;
        }
        const currentVersion = await this.getVersion(userId);
        return tokenVersion === currentVersion;
    }

    /**
     * ບັນທຶກ Version ລົງ Cache ຕອນ Login ຫຼື Refresh ສຳເລັດ
     */
    setVersion(userId: string, version: number): void {
        this.versions.set(userId, version);
    }
}
