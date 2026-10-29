import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IPowerContractRepository } from '../../domain/repositories/power-contract.repository.interface.js';
import { CreatePowerContractDto } from '../../application/dto/create-power-contract.dto.js';
import { UpdatePowerContractDto } from '../../application/dto/update-power-contract.dto.js';
import { PowerContract, PowerContractType, ContractStatus, AuditAction } from '@prisma/client';

@Injectable()
export class PowerContractRepository implements IPowerContractRepository {
    constructor(private readonly prisma: PrismaService) { }

    private extractNumericCapacity(capacityStr?: string | null): number | null {
        if (!capacityStr) return null;
        const match = capacityStr.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.powerContract.findFirst({
            where: { id, deletedAt: null },
            include: {
                createdBy: {
                    select: { id: true, fullName: true, employeeCode: true, department: true, division: true },
                },
                updatedBy: {
                    select: { id: true, fullName: true, employeeCode: true },
                },
                attachments: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        fileName: true,
                        mimeType: true,
                        fileSize: true,
                        version: true,
                        createdAt: true,
                        uploadedBy: { select: { id: true, fullName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                auditLogs: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                employeeCode: true,
                                department: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async createContractWithAudit(
        dto: CreatePowerContractDto,
        initialStatus: ContractStatus,
        userId: string,
    ): Promise<PowerContract> {
        const capacityValue =
            dto.capacityValue ?? this.extractNumericCapacity(dto.installedCapacity);

        return this.prisma.$transaction(async (tx) => {
            const newContract = await tx.powerContract.create({
                data: {
                    contractType: dto.contractType,
                    contractNumber: dto.contractNumber,
                    projectName: dto.projectName,
                    projectTypeOrCustomer: dto.projectTypeOrCustomer,
                    durationText: dto.durationText,
                    durationMonths: dto.durationMonths,
                    signedDate: dto.signedDate,
                    effectiveDate: dto.effectiveDate,
                    expirationDate: dto.expirationDate,
                    installedCapacity: dto.installedCapacity,
                    capacityValue: capacityValue !== null && capacityValue !== undefined ? capacityValue : null,
                    capacityUnit: dto.capacityUnit || 'MW',
                    projectLocation: dto.projectLocation,
                    tariff: dto.tariff,
                    tariffValue: dto.tariffValue,
                    tariffCurrency: dto.tariffCurrency || 'USD',
                    additionalDetails: dto.additionalDetails,
                    notifyDaysBefore: dto.notifyDaysBefore || 60,
                    status: initialStatus,
                    createdById: userId,
                },
                include: {
                    createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    powerContractId: newContract.id,
                    action: 'CREATE_POWER_CONTRACT',
                    newValues: JSON.parse(JSON.stringify(newContract)),
                },
            });

            return newContract;
        });
    }

    async updateContractWithAudit(
        id: string,
        dto: UpdatePowerContractDto,
        userId: string,
    ): Promise<PowerContract> {
        return this.prisma.$transaction(async (tx) => {
            const oldContract = await tx.powerContract.findFirst({
                where: { id, deletedAt: null },
            });

            if (!oldContract) {
                throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້ານີ້ໃນລະບົບ (Power Contract not found)');
            }

            const updateData: any = {
                ...dto,
                updatedById: userId,
            };

            if (dto.installedCapacity !== undefined && dto.capacityValue === undefined) {
                updateData.capacityValue = this.extractNumericCapacity(dto.installedCapacity);
            }

            // Automatic status recalculation based on dates if status is not explicitly provided
            if ((dto.effectiveDate !== undefined || dto.expirationDate !== undefined) && !dto.status) {
                const now = new Date();
                const effectiveDate = dto.effectiveDate !== undefined ? dto.effectiveDate : oldContract.effectiveDate;
                const expirationDate = dto.expirationDate !== undefined ? dto.expirationDate : oldContract.expirationDate;
                const notifyDays = dto.notifyDaysBefore ?? oldContract.notifyDaysBefore ?? 60;

                if (effectiveDate && new Date(effectiveDate) > now) {
                    updateData.status = ContractStatus.DRAFT;
                } else if (expirationDate) {
                    const expireDate = new Date(expirationDate);
                    const daysToExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysToExpiry <= 0) {
                        updateData.status = ContractStatus.EXPIRED;
                    } else if (daysToExpiry <= notifyDays) {
                        updateData.status = ContractStatus.EXPIRING_SOON;
                    } else {
                        updateData.status = ContractStatus.ACTIVE;
                        updateData.isExpiryNotified = false;
                    }
                } else {
                    updateData.status = ContractStatus.ACTIVE;
                    updateData.isExpiryNotified = false;
                }
            }

            const updatedContract = await tx.powerContract.update({
                where: { id },
                data: updateData,
                include: {
                    updatedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeCode: true,
                            department: true,
                            role: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    powerContractId: id,
                    action: 'UPDATE_POWER_CONTRACT',
                    oldValues: JSON.parse(JSON.stringify(oldContract)),
                    newValues: JSON.parse(JSON.stringify(updatedContract)),
                },
            });

            return updatedContract;
        });
    }

    async getContractHistory(
        contractId: string,
        params?: { skip?: number; take?: number; action?: AuditAction },
    ): Promise<{ data: any[]; total: number }> {
        const where: any = { powerContractId: contractId };
        if (params?.action) {
            where.action = params.action;
        }

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: params?.skip ?? 0,
                take: params?.take ?? 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeCode: true,
                            department: true,
                            role: true,
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { data, total };
    }

    async deleteContractWithAudit(id: string, userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const contract = await tx.powerContract.findFirst({
                where: { id, deletedAt: null },
            });

            if (!contract) {
                throw new NotFoundException('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້ານີ້ໃນລະບົບ (Power Contract not found)');
            }

            await tx.powerContract.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    updatedById: userId,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId,
                    powerContractId: id,
                    action: 'DELETE_POWER_CONTRACT',
                    oldValues: {
                        id,
                        projectName: contract.projectName,
                        contractType: contract.contractType,
                        contractNumber: contract.contractNumber,
                    },
                    newValues: { deletedAt: new Date() },
                },
            });
        });
    }

    async findAllWithFilters(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        contractType?: PowerContractType;
        projectTypeOrCustomer?: string;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, search, status, contractType, projectTypeOrCustomer } = params;

        const whereCondition: any = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                { projectName: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search, mode: 'insensitive' } },
                { projectLocation: { contains: search, mode: 'insensitive' } },
                { projectTypeOrCustomer: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            whereCondition.status = status;
        }

        if (contractType) {
            whereCondition.contractType = contractType;
        }

        if (projectTypeOrCustomer) {
            whereCondition.projectTypeOrCustomer = { contains: projectTypeOrCustomer, mode: 'insensitive' };
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.powerContract.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: { select: { fullName: true } },
                    _count: { select: { attachments: { where: { deletedAt: null } } } },
                },
            }),
            this.prisma.powerContract.count({ where: whereCondition }),
        ]);

        return { data, total };
    }

    async findContractsExpiringSoon(days: number): Promise<PowerContract[]> {
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);

        return this.prisma.powerContract.findMany({
            where: {
                status: ContractStatus.ACTIVE,
                deletedAt: null,
                isExpiryNotified: false,
                expirationDate: {
                    gte: today,
                    lte: targetDate,
                    not: null,
                },
            },
        });
    }

    async markContractAsExpiringAndNotify(contractId: string, daysRemaining: number): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.powerContract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.EXPIRING_SOON,
                    isExpiryNotified: true,
                    lastNotifiedAt: new Date(),
                },
            });

            const contract = await tx.powerContract.findUnique({ where: { id: contractId } });

            await tx.powerContractNotification.create({
                data: {
                    powerContractId: contractId,
                    title: 'ແຈ້ງເຕືອນ: ສັນຍາຊື້-ຂາຍໄຟຟ້າໃກ້ຈະສິ້ນສຸດ',
                    message: `ສັນຍາ "${contract!.projectName}" (${contract!.contractType === 'PURCHASE' ? 'ສັນຍາຊື້ໄຟຟ້າ' : 'ສັນຍາຂາຍໄຟຟ້າ'}) ຈະສິ້ນສຸດໃນອີກ ${daysRemaining} ວັນ.`,
                    daysRemaining,
                },
            });
        });
    }

    async findExpiredActiveContracts(): Promise<PowerContract[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.powerContract.findMany({
            where: {
                status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING_SOON] },
                deletedAt: null,
                expirationDate: {
                    lt: today,
                    not: null,
                },
            },
        });
    }

    async markContractAsExpiredAndNotify(contractId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.powerContract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.EXPIRED,
                    lastNotifiedAt: new Date(),
                },
            });

            const contract = await tx.powerContract.findUnique({ where: { id: contractId } });

            await tx.powerContractNotification.create({
                data: {
                    powerContractId: contractId,
                    title: 'ແຈ້ງເຕືອນ: ສັນຍາຊື້-ຂາຍໄຟຟ້າໝົດອາຍຸແລ້ວ',
                    message: `ສັນຍາ "${contract!.projectName}" ໄດ້ສິ້ນສຸດອາຍຸສັນຍາແລ້ວ.`,
                    daysRemaining: 0,
                },
            });
        });
    }

    async getDashboardStats() {
        const [
            total,
            byStatus,
            byTypeRaw,
            capacityPurchaseRaw,
            capacitySaleRaw,
            byProjectTypeRaw,
            totalCapacityRaw,
            expiringSoonCount,
            expiredCount,
            expiringSoonList,
        ] = await Promise.all([
            this.prisma.powerContract.count({ where: { deletedAt: null } }),
            this.prisma.powerContract.groupBy({
                by: ['status'],
                _count: { id: true },
                where: { deletedAt: null },
            }),
            this.prisma.powerContract.groupBy({
                by: ['contractType'],
                _count: { id: true },
                where: { deletedAt: null },
            }),
            this.prisma.powerContract.aggregate({
                where: { deletedAt: null, contractType: PowerContractType.PURCHASE },
                _sum: { capacityValue: true },
            }),
            this.prisma.powerContract.aggregate({
                where: { deletedAt: null, contractType: PowerContractType.SALE },
                _sum: { capacityValue: true },
            }),
            this.prisma.powerContract.groupBy({
                by: ['projectTypeOrCustomer'],
                _count: { id: true },
                _sum: { capacityValue: true },
                where: { deletedAt: null },
            }),
            this.prisma.powerContract.aggregate({
                where: { deletedAt: null },
                _sum: { capacityValue: true },
            }),
            this.prisma.powerContract.count({
                where: { deletedAt: null, status: ContractStatus.EXPIRING_SOON },
            }),
            this.prisma.powerContract.count({
                where: { deletedAt: null, status: ContractStatus.EXPIRED },
            }),
            this.prisma.powerContract.findMany({
                where: {
                    deletedAt: null,
                    status: ContractStatus.EXPIRING_SOON,
                },
                select: {
                    id: true,
                    projectName: true,
                    contractType: true,
                    contractNumber: true,
                    expirationDate: true,
                    installedCapacity: true,
                    capacityValue: true,
                    projectTypeOrCustomer: true,
                },
                orderBy: { expirationDate: 'asc' },
                take: 10,
            }),
        ]);

        const purchaseItem = byTypeRaw.find((t) => t.contractType === PowerContractType.PURCHASE);
        const saleItem = byTypeRaw.find((t) => t.contractType === PowerContractType.SALE);

        return {
            total,
            expiringSoonCount,
            expiredCount,
            byStatus,
            byContractType: {
                purchaseCount: purchaseItem ? purchaseItem._count.id : 0,
                saleCount: saleItem ? saleItem._count.id : 0,
                totalCapacityPurchase: Number(capacityPurchaseRaw._sum.capacityValue || 0),
                totalCapacitySale: Number(capacitySaleRaw._sum.capacityValue || 0),
            },
            byProjectType: byProjectTypeRaw.map((p) => ({
                name: p.projectTypeOrCustomer,
                count: p._count.id,
                totalCapacity: Number(p._sum.capacityValue || 0),
            })),
            totalInstalledCapacity: Number(totalCapacityRaw._sum.capacityValue || 0),
            expiringSoonList,
        };
    }
}

