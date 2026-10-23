import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IContractRepository } from '../../domain/repositories/contract.repository.interface.js';
import { CreateContractDto } from '../../application/dto/create-contract.dto.js';
import { UpdateContractDto } from '../../application/dto/update-contract.dto.js';
import { Contract, ContractType, ContractStatus, AuditAction } from '@prisma/client';

@Injectable()
export class ContractRepository implements IContractRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findContractTypeById(id: number): Promise<ContractType | null> {
        return this.prisma.contractType.findUnique({ where: { id } });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.contract.findFirst({
            where: { id, deletedAt: null },
            include: {
                contractType: true,
                createdBy: { select: { id: true, fullName: true, employeeCode: true, department: true } },
                updatedBy: { select: { id: true, fullName: true, employeeCode: true } },
                attachments: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        fileName: true,
                        mimeType: true,
                        fileSize: true,
                        version: true,
                        createdAt: true,
                        uploadedBy: { select: { fullName: true } },
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
        dto: CreateContractDto,
        initialStatus: ContractStatus,
        userId: string,
    ): Promise<Contract> {
        return this.prisma.$transaction(async (tx) => {
            const newContract = await tx.contract.create({
                data: {
                    title: dto.title,
                    contractTypeId: dto.contractTypeId,
                    contractNumber: dto.contractNumber,
                    durationText: dto.durationText,
                    durationMonths: dto.durationMonths,
                    signedDate: dto.signedDate,
                    effectiveDate: dto.effectiveDate,
                    expirationDate: dto.expirationDate,
                    contractValue: dto.contractValue,
                    currency: dto.currency || 'LAK',
                    equityOrCapitalContribution: dto.equityOrCapitalContribution,
                    sharePercentage: dto.sharePercentage,
                    implementer: dto.implementer,
                    additionalDetails: dto.additionalDetails,
                    notifyDaysBefore: dto.notifyDaysBefore || 60,
                    status: initialStatus,
                    createdById: userId,
                },
                include: {
                    contractType: true,
                    createdBy: { select: { id: true, fullName: true, employeeCode: true } },
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: userId,
                    contractId: newContract.id,
                    action: 'CREATE_CONTRACT',
                    newValues: JSON.parse(JSON.stringify(newContract)),
                },
            });

            return newContract;
        });
    }

    async updateContractWithAudit(
        id: string,
        dto: UpdateContractDto,
        userId: string,
    ): Promise<Contract> {
        return this.prisma.$transaction(async (tx) => {
            const oldContract = await tx.contract.findFirst({
                where: { id, deletedAt: null },
                include: {
                    contractType: true,
                },
            });

            if (!oldContract) {
                throw new NotFoundException('ບໍ່ພົບສັນຍານີ້ໃນລະບົບ (Contract not found)');
            }

            // คำนวณสถานะใหม่และรีเซ็ตการแจ้งเตือนอัตโนมัติหากมีการแก้ไขวันมีผลบังคับใช้หรือวันสิ้นสุดสัญญา
            const updateData: any = {
                ...dto,
                updatedById: userId,
            };

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

            const updatedContract = await tx.contract.update({
                where: { id },
                data: updateData,
                include: {
                    contractType: true,
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
                    userId: userId,
                    contractId: id,
                    action: 'UPDATE_CONTRACT',
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
        const where: any = { contractId };
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
            const contract = await tx.contract.findFirst({
                where: { id, deletedAt: null },
            });

            if (!contract) {
                throw new NotFoundException('ບໍ່ພົບສັນຍານີ້ໃນລະບົບ (Contract not found)');
            }

            await tx.contract.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    updatedById: userId,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: userId,
                    contractId: id,
                    action: 'DELETE_CONTRACT',
                    oldValues: { id, title: contract.title, contractNumber: contract.contractNumber },
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
        contractTypeId?: number;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, search, status, contractTypeId } = params;

        const whereCondition: any = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search, mode: 'insensitive' } },
                { implementer: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            whereCondition.status = status;
        }

        if (contractTypeId) {
            whereCondition.contractTypeId = Number(contractTypeId);
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.contract.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    contractType: { select: { id: true, nameLo: true, nameEn: true } },
                    createdBy: { select: { fullName: true } },
                    _count: { select: { attachments: { where: { deletedAt: null } } } },
                },
            }),
            this.prisma.contract.count({ where: whereCondition }),
        ]);

        return { data, total };
    }

    async findContractsExpiringSoon(days: number): Promise<Contract[]> {
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);

        return this.prisma.contract.findMany({
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
            await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.EXPIRING_SOON,
                    isExpiryNotified: true,
                    lastNotifiedAt: new Date(),
                },
            });

            const contract = await tx.contract.findUnique({ where: { id: contractId } });

            await tx.contractNotification.create({
                data: {
                    contractId: contractId,
                    title: 'ແຈ້ງເຕືອນ: ສັນຍາໃກ້ຈະສິ້ນສຸດ',
                    message: `ສັນຍາ "${contract!.title}" (ເລກທີ: ${contract!.contractNumber}) ຈະສິ້ນສຸດໃນອີກ ${daysRemaining} ວັນ.`,
                    daysRemaining: daysRemaining,
                },
            });
        });
    }

    async findExpiredActiveContracts(): Promise<Contract[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.contract.findMany({
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
            await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.EXPIRED,
                    lastNotifiedAt: new Date(),
                },
            });

            const contract = await tx.contract.findUnique({ where: { id: contractId } });

            await tx.contractNotification.create({
                data: {
                    contractId: contractId,
                    title: 'ແຈ້ງເຕືອນ: ສັນຍາໝົດອາຍຸແລ້ວ',
                    message: `ສັນຍາ "${contract!.title}" (ເລກທີ: ${contract!.contractNumber}) ໄດ້ສິ້ນສຸດອາຍຸສັນຍາແລ້ວ.`,
                    daysRemaining: 0,
                },
            });
        });
    }

    async getDashboardStats() {
        const [total, byStatus, byCurrency, byContractTypeRaw, valueByCurrencyRaw, expiringSoonCount, expiredCount] =
            await Promise.all([
                this.prisma.contract.count({ where: { deletedAt: null } }),
                this.prisma.contract.groupBy({
                    by: ['status'],
                    _count: { id: true },
                    where: { deletedAt: null },
                }),
                this.prisma.contract.groupBy({
                    by: ['currency'],
                    _count: { id: true },
                    where: { deletedAt: null },
                }),
                this.prisma.contract.groupBy({
                    by: ['contractTypeId'],
                    _count: { id: true },
                    where: { deletedAt: null },
                }),
                this.prisma.contract.groupBy({
                    by: ['currency'],
                    _sum: { contractValue: true },
                    where: { deletedAt: null },
                }),
                this.prisma.contract.count({
                    where: { deletedAt: null, status: ContractStatus.EXPIRING_SOON },
                }),
                this.prisma.contract.count({
                    where: { deletedAt: null, status: ContractStatus.EXPIRED },
                }),
            ]);

        const contractTypes = await this.prisma.contractType.findMany({
            select: { id: true, nameLo: true, nameEn: true },
        });

        const byContractType = byContractTypeRaw.map((item) => {
            const typeInfo = contractTypes.find((t) => t.id === item.contractTypeId);
            return {
                contractTypeId: item.contractTypeId,
                nameLo: typeInfo?.nameLo || 'ບໍ່ຮູ້ຈັກ',
                nameEn: typeInfo?.nameEn || null,
                count: item._count.id,
            };
        });

        const valueByCurrency = valueByCurrencyRaw.map((item) => ({
            currency: item.currency,
            totalValue: item._sum.contractValue || 0,
        }));

        return {
            total,
            expiringSoonCount,
            expiredCount,
            byStatus,
            byCurrency,
            valueByCurrency,
            byContractType,
        };
    }
}
